import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type DepartmentType = Database["public"]["Enums"]["department_type"];

interface AddDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  onSuccess: () => void;
}

export function AddDocumentDialog({
  open,
  onOpenChange,
  taskId,
  onSuccess,
}: AddDocumentDialogProps) {
  const [title, setTitle] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [assignedTo, setAssignedTo] = useState<DepartmentType>("transport");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error("Please enter a title for the document requirement");
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase.from("task_attachments").insert({
        task_id: taskId,
        attachment_type: "document",
        title: title.trim(),
        is_required: isRequired,
        assigned_to: assignedTo,
      });

      if (error) throw error;

      toast.success("Document requirement added");
      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Error adding document requirement:", error);
      toast.error("Failed to add requirement");
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setTitle("");
    setIsRequired(false);
    setAssignedTo("transport");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Add Document Requirement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              placeholder="e.g., Proof of Delivery, Vehicle Photo, Invoice..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Assign To */}
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
              This document will be visible to users in the selected department
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="required">Required</Label>
              <p className="text-sm text-muted-foreground">
                Must be uploaded before task completion
              </p>
            </div>
            <Switch
              id="required"
              checked={isRequired}
              onCheckedChange={setIsRequired}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Document
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
