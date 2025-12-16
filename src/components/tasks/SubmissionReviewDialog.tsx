import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Flag, Loader2, Download, FileText, ExternalLink, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";

type TaskSubmission = Tables<"task_submissions">;

interface SubmissionReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: TaskSubmission;
  initialAction: "approve" | "reject" | "flag";
  onSuccess: () => void;
  taskTitle?: string;
  attachmentTitle?: string;
  taskId?: string;
}

const actionConfig = {
  approve: {
    label: "Approve",
    status: "approved" as const,
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
  },
  reject: {
    label: "Reject",
    status: "rejected" as const,
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
  },
  flag: {
    label: "Flag for Review",
    status: "flagged" as const,
    icon: Flag,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 border-yellow-200",
  },
};

export function SubmissionReviewDialog({
  open,
  onOpenChange,
  submission,
  initialAction,
  onSuccess,
  taskTitle,
  attachmentTitle,
  taskId,
}: SubmissionReviewDialogProps) {
  const { user } = useAuth();
  const [action, setAction] = useState<"approve" | "reject" | "flag">(initialAction);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);

  const formData = submission.form_data as Record<string, unknown> | null;
  const isDocument = !formData && submission.file_path;
  const isImage = submission.file_name?.match(/\.(jpg|jpeg|png|webp|gif)$/i);

  // Fetch signed URL for document preview
  useEffect(() => {
    if (open && isDocument && submission.file_path) {
      fetchDocumentUrl();
    }
  }, [open, submission.file_path]);

  async function fetchDocumentUrl() {
    if (!submission.file_path) return;
    
    setIsLoadingDocument(true);
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(submission.file_path, 3600); // 1 hour expiry

      if (error) throw error;
      setDocumentUrl(data.signedUrl);
    } catch (error) {
      console.error("Error fetching document URL:", error);
      toast.error("Could not load document preview");
    } finally {
      setIsLoadingDocument(false);
    }
  }

  async function handleDownload() {
    if (!submission.file_path) return;

    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(submission.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = submission.file_name || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  }

  // Check if all required submissions are approved and complete the task
  async function checkAndCompleteTask(taskId: string) {
    try {
      // Get all required attachments for this task
      const { data: requiredAttachments, error: attachmentsError } = await supabase
        .from("task_attachments")
        .select("id")
        .eq("task_id", taskId)
        .eq("is_required", true);

      if (attachmentsError) throw attachmentsError;

      if (!requiredAttachments || requiredAttachments.length === 0) {
        // No required attachments, don't auto-complete
        return;
      }

      // For each required attachment, check if there's an approved submission
      const attachmentIds = requiredAttachments.map((a) => a.id);
      
      const { data: approvedSubmissions, error: submissionsError } = await supabase
        .from("task_submissions")
        .select("task_attachment_id")
        .in("task_attachment_id", attachmentIds)
        .eq("status", "approved");

      if (submissionsError) throw submissionsError;

      // Get unique attachment IDs with approved submissions
      const approvedAttachmentIds = new Set(
        approvedSubmissions?.map((s) => s.task_attachment_id) || []
      );

      // Check if all required attachments have approved submissions
      const allApproved = requiredAttachments.every((a) =>
        approvedAttachmentIds.has(a.id)
      );

      if (allApproved) {
        // Update task status to completed
        const { error: updateError } = await supabase
          .from("tasks")
          .update({ status: "completed" })
          .eq("id", taskId);

        if (updateError) {
          console.error("Error completing task:", updateError);
        } else {
          toast.success("All requirements approved - Task marked as completed!");
        }
      }
    } catch (error) {
      console.error("Error checking task completion:", error);
    }
  }

  async function handleSubmitReview() {
    if ((action === "reject" || action === "flag") && !comment.trim()) {
      toast.error("Please provide a comment for rejection or flagging");
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("task_submissions")
        .update({
          status: actionConfig[action].status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          reviewer_comments: comment.trim() || null,
        })
        .eq("id", submission.id);

      if (error) throw error;

      // If approving, check if all required submissions are now approved
      if (action === "approve" && taskId) {
        await checkAndCompleteTask(taskId);
      }

      // Send email notification (don't await - fire and forget)
      supabase.functions.invoke("send-submission-notification", {
        body: {
          submissionId: submission.id,
          status: actionConfig[action].status,
          reviewerComments: comment.trim() || undefined,
          taskTitle,
          attachmentTitle,
        },
      }).then((res) => {
        if (res.error) {
          console.error("Failed to send notification:", res.error);
        } else {
          console.log("Notification sent successfully");
        }
      });

      toast.success(`Submission ${actionConfig[action].label.toLowerCase()}d successfully`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error reviewing submission:", error);
      toast.error("Failed to submit review");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Submission</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 overflow-scroll">
          <div className="space-y-6 py-4">
            {/* Submission Info */}
            <div className="text-sm text-muted-foreground">
              <p>Submitted by: <span className="font-medium text-foreground">{submission.submitted_by_name || "Unknown"}</span></p>
              <p>Date: {format(new Date(submission.created_at), "dd MMM yyyy, HH:mm")}</p>
            </div>

            <Separator />

            {/* Form Data Display */}
            {formData && Object.keys(formData).length > 0 ? (
              <div className="space-y-4">
                <h4 className="font-medium">Submitted Data</h4>
                <div className="space-y-3">
                  {Object.entries(formData).map(([key, value]) => (
                    <div key={key} className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="font-medium">
                        {typeof value === "boolean" 
                          ? (value ? "Yes" : "No") 
                          : String(value) || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : isDocument ? (
              <div className="space-y-4">
                <h4 className="font-medium">Uploaded Document</h4>
                
                {isLoadingDocument ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Document Info Card */}
                    <div className="p-4 rounded-lg border bg-muted/30 flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        {isImage ? (
                          <ImageIcon className="h-6 w-6 text-primary" />
                        ) : (
                          <FileText className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{submission.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded {format(new Date(submission.created_at), "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>

                    {/* Image Preview */}
                    {isImage && documentUrl && (
                      <div className="border rounded-lg overflow-hidden bg-muted/30">
                        <img
                          src={documentUrl}
                          alt={submission.file_name || "Document preview"}
                          className="w-full max-h-64 object-contain"
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {documentUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(documentUrl, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No submission data available</p>
            )}

            <Separator />

            {/* Review Action Selection */}
            <div className="space-y-3">
              <Label>Select Your Decision</Label>
              <RadioGroup
                value={action}
                onValueChange={(value) => setAction(value as "approve" | "reject" | "flag")}
                className="flex flex-row gap-2"
              >
                {(["approve", "reject", "flag"] as const).map((actionType) => {
                  const config = actionConfig[actionType];
                  const Icon = config.icon;
                  return (
                    <div key={actionType} className="flex-1">
                      <RadioGroupItem
                        value={actionType}
                        id={actionType}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={actionType}
                        className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-colors peer-data-[state=checked]:${config.bgColor} peer-data-[state=checked]:border-current ${config.color} hover:bg-muted`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{config.label}</span>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {/* Comment */}
            <div className="space-y-2 px-1">
              <Label htmlFor="comment">
                Comment {(action === "reject" || action === "flag") && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                id="comment"
                placeholder={
                  action === "approve"
                    ? "Optional comment..."
                    : "Explain why this submission is being " + (action === "reject" ? "rejected" : "flagged") + "..."
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitReview} 
            disabled={isLoading}
            className={
              action === "approve" ? "bg-green-600 hover:bg-green-700" :
              action === "reject" ? "bg-red-600 hover:bg-red-700" :
              "bg-yellow-600 hover:bg-yellow-700"
            }
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {actionConfig[action].label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
