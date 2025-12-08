import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, FileText, XCircle, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

type TaskAttachment = Tables<"task_attachments"> & {
  submissions?: Tables<"task_submissions">[];
};

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachment: TaskAttachment;
  onSuccess: () => void;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DocumentUploadDialog({
  open,
  onOpenChange,
  attachment,
  onSuccess,
}: DocumentUploadDialogProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Get the latest submission for showing feedback
  const latestSubmission = attachment.submissions?.[attachment.submissions.length - 1];
  const isResubmission = latestSubmission?.status === "rejected" || latestSubmission?.status === "flagged";
  const reviewerComments = latestSubmission?.reviewer_comments;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Please upload PDF, Word document, or image files.");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }

    setSelectedFile(file);
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUpload() {
    if (!selectedFile || !user) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Generate unique file path
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${attachment.task_id}/${attachment.id}/${Date.now()}.${fileExt}`;

      setUploadProgress(30);

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      // Create submission record
      const { error: submissionError } = await supabase
        .from("task_submissions")
        .insert({
          task_attachment_id: attachment.id,
          file_path: fileName,
          file_name: selectedFile.name,
          submitted_by: user.id,
          submitted_by_name: `${user.firstName} ${user.lastName}`.trim(),
          status: "submitted",
        });

      if (submissionError) throw submissionError;

      // Update task status to in_progress if it's currently 'new'
      const { error: taskUpdateError } = await supabase
        .from("tasks")
        .update({ status: "in_progress" })
        .eq("id", attachment.task_id)
        .eq("status", "new");

      if (taskUpdateError) {
        console.error("Error updating task status:", taskUpdateError);
      }

      setUploadProgress(100);

      toast.success("Document uploaded successfully");
      setSelectedFile(null);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{attachment.title}</DialogTitle>
          <DialogDescription>
            Upload the required document for this task.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reviewer feedback alert for resubmissions */}
          {isResubmission && reviewerComments && (
            <Alert variant="destructive" className="border-2">
              <div className="flex items-start gap-3">
                {latestSubmission?.status === "rejected" ? (
                  <XCircle className="h-5 w-5 mt-0.5" />
                ) : (
                  <Flag className="h-5 w-5 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold mb-1">
                    {latestSubmission?.status === "rejected" ? "Document Rejected" : "Document Flagged"}
                  </p>
                  <p className="text-sm opacity-90">{reviewerComments}</p>
                  <p className="text-xs mt-2 opacity-75">
                    Please upload a new document addressing the feedback.
                  </p>
                </div>
              </div>
            </Alert>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {selectedFile ? (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isUploading && (
                <div className="mt-3">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Click to select a file</p>
              <p className="text-sm text-muted-foreground mt-1">
                PDF, Word, or image files up to 10MB
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
