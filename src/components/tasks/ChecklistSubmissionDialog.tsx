import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, AlertCircle, MessageSquareWarning, XCircle, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Tables, Json } from "@/integrations/supabase/types";
import { DynamicFieldRenderer, FormField } from "@/components/forms/DynamicFieldRenderer";
import { Alert, AlertDescription } from "@/components/ui/alert";

type TaskAttachment = Tables<"task_attachments"> & {
  submissions?: Tables<"task_submissions">[];
};
type TemplateField = Tables<"checklist_template_fields">;

interface ChecklistSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachment: TaskAttachment;
  onSuccess: () => void;
}

export function ChecklistSubmissionDialog({
  open,
  onOpenChange,
  attachment,
  onSuccess,
}: ChecklistSubmissionDialogProps) {
  const { user } = useAuth();
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the latest submission for pre-filling and showing feedback
  const latestSubmission = attachment.submissions?.[attachment.submissions.length - 1];
  const previousFormData = latestSubmission?.form_data as Record<string, unknown> | null;
  const isResubmission = latestSubmission?.status === "rejected" || latestSubmission?.status === "flagged";
  const reviewerComments = latestSubmission?.reviewer_comments;

  useEffect(() => {
    if (open && attachment.checklist_template_id) {
      fetchTemplateFields();
    }
  }, [open, attachment.checklist_template_id]);

  async function fetchTemplateFields() {
    if (!attachment.checklist_template_id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("checklist_template_fields")
        .select("*")
        .eq("template_id", attachment.checklist_template_id)
        .order("display_order", { ascending: true });

      if (error) throw error;

      const mappedFields: FormField[] = (data || []).map((f: TemplateField) => ({
        id: f.id,
        field_name: f.field_name,
        field_label: f.field_label,
        field_type: f.field_type,
        is_required: f.is_required,
        options: Array.isArray(f.options) ? (f.options as string[]) : null,
        placeholder: f.placeholder,
        help_text: f.help_text,
        display_order: f.display_order,
      }));

      setFields(mappedFields);
      
      // Initialize form data - pre-fill with previous submission if available
      const initialData: Record<string, unknown> = {};
      mappedFields.forEach((field) => {
        if (previousFormData && previousFormData[field.field_name] !== undefined) {
          // Use previous value, but skip file fields (they can't be restored)
          if (field.field_type === "file") {
            initialData[field.field_name] = null;
          } else {
            initialData[field.field_name] = previousFormData[field.field_name];
          }
        } else {
          initialData[field.field_name] = field.field_type === "checkbox" ? false : "";
        }
      });
      setFormData(initialData);
    } catch (error) {
      console.error("Error fetching template fields:", error);
      toast.error("Failed to load checklist form");
    } finally {
      setIsLoading(false);
    }
  }

  function handleFieldChange(fieldName: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      if (field.is_required) {
        const value = formData[field.field_name];
        if (value === undefined || value === null || value === "" || 
            (field.field_type === "checkbox" && value === false)) {
          newErrors[field.field_name] = `${field.field_label} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to submit");
      return;
    }

    setIsSubmitting(true);
    try {
      // Clean form data for storage (remove File objects, keep only serializable data)
      const cleanFormData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(formData)) {
        if (value && typeof value === "object" && "file" in value && "name" in value) {
          // For file fields, just store the file name (actual file upload would need separate handling)
          cleanFormData[key] = { name: String((value as Record<string, unknown>).name), uploaded: true };
        } else {
          cleanFormData[key] = value;
        }
      }

      const { error } = await supabase.from("task_submissions").insert({
        task_attachment_id: attachment.id,
        form_data: cleanFormData as Json,
        submitted_by: user.id,
        submitted_by_name: `${user.firstName} ${user.lastName}`.trim(),
        status: "submitted",
      });

      if (error) throw error;

      // Update task status to in_progress if it's currently 'new'
      const { error: taskUpdateError } = await supabase
        .from("tasks")
        .update({ status: "in_progress" })
        .eq("id", attachment.task_id)
        .eq("status", "new");

      if (taskUpdateError) {
        console.error("Error updating task status:", taskUpdateError);
      }

      toast.success("Checklist submitted successfully");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error submitting checklist:", error);
      toast.error("Failed to submit checklist");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{attachment.title}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : fields.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This checklist has no fields configured.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-4 -mr-4">
              <div className="space-y-6 py-4">
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
                          {latestSubmission?.status === "rejected" ? "Submission Rejected" : "Submission Flagged"}
                        </p>
                        <p className="text-sm opacity-90">{reviewerComments}</p>
                        <p className="text-xs mt-2 opacity-75">
                          Please address the feedback above and resubmit.
                        </p>
                      </div>
                    </div>
                  </Alert>
                )}

                {fields.map((field) => (
                  <DynamicFieldRenderer
                    key={field.id}
                    field={field}
                    value={formData[field.field_name]}
                    onChange={(value) => handleFieldChange(field.field_name, value)}
                    error={errors[field.field_name]}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </ScrollArea>

            <DialogFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Checklist
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
