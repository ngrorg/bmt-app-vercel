import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ClipboardList,
  FileUp,
  CheckCircle2,
  XCircle,
  Flag,
  Clock,
  Eye,
  Trash2,
  MoreVertical,
  Truck,
  Warehouse,
  PenLine,
  Upload,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { SubmissionReviewDialog } from "./SubmissionReviewDialog";
import { ChecklistSubmissionDialog } from "./ChecklistSubmissionDialog";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

type TaskAttachment = Tables<"task_attachments"> & {
  checklist_templates?: { title: string; description: string | null } | null;
  submissions?: TaskSubmission[];
};
type TaskSubmission = Tables<"task_submissions">;

interface AttachmentsListProps {
  attachments: TaskAttachment[];
  canReview: boolean;
  onRefresh: () => void;
  taskTitle?: string;
  taskId?: string;
}

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "bg-muted text-muted-foreground" },
  submitted: { label: "Submitted", icon: Clock, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  approved: { label: "Approved", icon: CheckCircle2, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  rejected: { label: "Rejected", icon: XCircle, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  flagged: { label: "Flagged", icon: Flag, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
};

export function AttachmentsList({ attachments, canReview, onRefresh, taskTitle, taskId }: AttachmentsListProps) {
  const { user } = useAuth();
  const [reviewingSubmission, setReviewingSubmission] = useState<{ submission: TaskSubmission; attachmentTitle: string } | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | "flag">("approve");
  const [submittingChecklist, setSubmittingChecklist] = useState<TaskAttachment | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState<TaskAttachment | null>(null);

  const isAdmin = user?.role === "admin";
  const isDriver = user?.role === "driver";

  async function handleDeleteAttachment(attachmentId: string) {
    if (!confirm("Are you sure you want to delete this requirement? All submissions will also be deleted.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("task_attachments")
        .delete()
        .eq("id", attachmentId);

      if (error) throw error;
      toast.success("Requirement deleted");
      onRefresh();
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Failed to delete requirement");
    }
  }

  function openReviewDialog(submission: TaskSubmission, action: "approve" | "reject" | "flag", attachmentTitle: string) {
    setReviewingSubmission({ submission, attachmentTitle });
    setReviewAction(action);
  }

  return (
    <div className="space-y-4">
      {attachments.map((attachment) => {
        const latestSubmission = attachment.submissions?.[attachment.submissions.length - 1];
        const status = latestSubmission?.status || "pending";
        const StatusIcon = statusConfig[status].icon;

        return (
          <Card key={attachment.id} className="border-l-4 border-l-primary/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-muted">
                    {attachment.attachment_type === "checklist" ? (
                      <ClipboardList className="h-5 w-5 text-primary" />
                    ) : (
                      <FileUp className="h-5 w-5 text-accent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold truncate">{attachment.title}</h4>
                      {attachment.assigned_to && (
                        <Badge variant="secondary" className="text-xs">
                          {attachment.assigned_to === "transport" ? (
                            <><Truck className="h-3 w-3 mr-1" />Transport</>
                          ) : (
                            <><Warehouse className="h-3 w-3 mr-1" />Warehouse</>
                          )}
                        </Badge>
                      )}
                      {attachment.is_required && (
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {attachment.attachment_type}
                      {attachment.checklist_templates?.description && (
                        <span> • {attachment.checklist_templates.description}</span>
                      )}
                    </p>

                    {/* Submission Status */}
                    <div className="mt-3 flex items-center gap-2">
                      <Badge className={statusConfig[status].color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[status].label}
                      </Badge>
                      {latestSubmission?.submitted_by_name && (
                        <span className="text-xs text-muted-foreground">
                          by {latestSubmission.submitted_by_name}
                        </span>
                      )}
                    </div>

                    {/* Driver Fill Out Action - only for pending checklists */}
                    {isDriver && attachment.attachment_type === "checklist" && status === "pending" && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          onClick={() => setSubmittingChecklist(attachment)}
                        >
                          <PenLine className="h-4 w-4 mr-2" />
                          Fill Out Checklist
                        </Button>
                      </div>
                    )}

                    {/* Driver Resubmit Action - for rejected/flagged checklists */}
                    {isDriver && attachment.attachment_type === "checklist" && ["rejected", "flagged"].includes(status) && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSubmittingChecklist(attachment)}
                        >
                          <PenLine className="h-4 w-4 mr-2" />
                          Resubmit Checklist
                        </Button>
                      </div>
                    )}

                    {/* Driver Upload Action - only for pending documents */}
                    {isDriver && attachment.attachment_type === "document" && status === "pending" && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          onClick={() => setUploadingDocument(attachment)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Document
                        </Button>
                      </div>
                    )}

                    {/* Driver Reupload Action - for rejected/flagged documents */}
                    {isDriver && attachment.attachment_type === "document" && ["rejected", "flagged"].includes(status) && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setUploadingDocument(attachment)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Reupload Document
                        </Button>
                      </div>
                    )}

                    {/* Review Actions for submitted items */}
                    {canReview && latestSubmission && ["submitted", "pending"].includes(status) && latestSubmission.form_data && (
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => openReviewDialog(latestSubmission, "approve", attachment.title)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => openReviewDialog(latestSubmission, "reject", attachment.title)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                          onClick={() => openReviewDialog(latestSubmission, "flag", attachment.title)}
                        >
                          <Flag className="h-4 w-4 mr-1" />
                          Flag
                        </Button>
                      </div>
                    )}

                    {/* Show reviewer comments if any */}
                    {latestSubmission?.reviewer_comments && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/50 text-sm">
                        <p className="font-medium text-xs text-muted-foreground mb-1">
                          Reviewer Comment:
                        </p>
                        <p>{latestSubmission.reviewer_comments}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Menu */}
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {latestSubmission && (
                        <DropdownMenuItem onClick={() => openReviewDialog(latestSubmission, "approve", attachment.title)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Submission
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Requirement
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Review Dialog */}
      {reviewingSubmission && (
        <SubmissionReviewDialog
          open={!!reviewingSubmission}
          onOpenChange={(open) => !open && setReviewingSubmission(null)}
          submission={reviewingSubmission.submission}
          initialAction={reviewAction}
          onSuccess={() => {
            setReviewingSubmission(null);
            onRefresh();
          }}
          taskTitle={taskTitle}
          attachmentTitle={reviewingSubmission.attachmentTitle}
          taskId={taskId}
        />
      )}

      {/* Checklist Submission Dialog */}
      {submittingChecklist && (
        <ChecklistSubmissionDialog
          open={!!submittingChecklist}
          onOpenChange={(open) => !open && setSubmittingChecklist(null)}
          attachment={submittingChecklist}
          onSuccess={() => {
            setSubmittingChecklist(null);
            onRefresh();
          }}
        />
      )}

      {/* Document Upload Dialog */}
      {uploadingDocument && (
        <DocumentUploadDialog
          open={!!uploadingDocument}
          onOpenChange={(open) => !open && setUploadingDocument(null)}
          attachment={uploadingDocument}
          onSuccess={() => {
            setUploadingDocument(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
