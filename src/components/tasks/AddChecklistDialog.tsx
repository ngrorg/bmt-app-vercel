import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables, Database } from "@/integrations/supabase/types";

type ChecklistTemplate = Tables<"checklist_templates">;
type DepartmentType = Database["public"]["Enums"]["department_type"];

interface AddChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  onSuccess: () => void;
}

export function AddChecklistDialog({
  open,
  onOpenChange,
  taskId,
  onSuccess,
}: AddChecklistDialogProps) {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isRequired, setIsRequired] = useState(false);
  const [assignedTo, setAssignedTo] = useState<DepartmentType>("transport");

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  async function fetchTemplates() {
    try {
      setIsLoadingTemplates(true);
      const { data, error } = await supabase
        .from("checklist_templates")
        .select("*")
        .order("title");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load checklist templates");
    } finally {
      setIsLoadingTemplates(false);
    }
  }

  async function handleSubmit() {
    if (!selectedTemplateId) {
      toast.error("Please select a checklist template");
      return;
    }

    try {
      setIsLoading(true);

      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

      const { error } = await supabase.from("task_attachments").insert({
        task_id: taskId,
        attachment_type: "checklist",
        title: selectedTemplate?.title || "Checklist",
        checklist_template_id: selectedTemplateId,
        is_required: isRequired,
        assigned_to: assignedTo,
      });

      if (error) throw error;

      toast.success("Checklist added to task");
      handleClose();
      onSuccess();
    } catch (error) {
      console.error("Error adding checklist:", error);
      toast.error("Failed to add checklist");
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    onOpenChange(false);
    setSelectedTemplateId("");
    setIsRequired(false);
    setAssignedTo("transport");
  }

  function handleCreateNew() {
    onOpenChange(false);
    navigate(`/tasks/${taskId}/checklist-builder`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Add Checklist Requirement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isLoadingTemplates ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Existing Templates */}
              <div className="space-y-2">
                <Label>Select Existing Template</Label>
                {templates.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border rounded-lg">
                    <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No templates available</p>
                  </div>
                ) : (
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex flex-col items-start">
                            <span>{template.title}</span>
                            {template.description && (
                              <span className="text-muted-foreground text-xs">
                                {template.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Assign To */}
              {selectedTemplateId && (
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Select value={assignedTo} onValueChange={(v) => setAssignedTo(v as DepartmentType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="transport">Transport (Drivers)</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This checklist will be visible to users in the selected department
                  </p>
                </div>
              )}

              {/* Required Toggle */}
              {selectedTemplateId && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <Label htmlFor="required">Required</Label>
                    <p className="text-sm text-muted-foreground">
                      Must be completed before task completion
                    </p>
                  </div>
                  <Switch
                    id="required"
                    checked={isRequired}
                    onCheckedChange={setIsRequired}
                  />
                </div>
              )}

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Create New Button */}
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleCreateNew}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Checklist
              </Button>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !selectedTemplateId}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Checklist
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
