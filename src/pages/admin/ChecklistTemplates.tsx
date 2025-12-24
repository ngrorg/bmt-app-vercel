import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Eye, FileText, Calendar, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { DynamicFieldRenderer, FormField } from "@/components/forms/DynamicFieldRenderer";
import { toast } from "sonner";

interface ChecklistTemplate {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface TemplateField {
  id: string;
  field_label: string;
  field_type: string;
  field_name: string;
  is_required: boolean;
  help_text: string | null;
  options: string[] | null;
  placeholder: string | null;
  display_order: number;
}

export default function ChecklistTemplates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [previewTemplate, setPreviewTemplate] = useState<ChecklistTemplate | null>(null);
  const [previewFields, setPreviewFields] = useState<TemplateField[]>([]);
  const [previewValues, setPreviewValues] = useState<Record<string, unknown>>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deleteTemplate, setDeleteTemplate] = useState<ChecklistTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["checklist-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ChecklistTemplate[];
    },
  });

  const handlePreview = async (template: ChecklistTemplate) => {
    setPreviewTemplate(template);
    setPreviewValues({});
    
    const { data: fields } = await supabase
      .from("checklist_template_fields")
      .select("*")
      .eq("template_id", template.id)
      .order("display_order", { ascending: true });

    setPreviewFields((fields as TemplateField[]) || []);
    setIsPreviewOpen(true);
  };

  const handleEdit = (template: ChecklistTemplate) => {
    navigate(`/checklist-templates/edit?templateId=${template.id}`);
  };

  const handleDelete = async () => {
    if (!deleteTemplate) return;
    
    setIsDeleting(true);
    try {
      // First delete template fields
      await supabase
        .from("checklist_template_fields")
        .delete()
        .eq("template_id", deleteTemplate.id);

      // Then delete the template
      const { error } = await supabase
        .from("checklist_templates")
        .delete()
        .eq("id", deleteTemplate.id);

      if (error) throw error;

      toast.success("Template deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    } finally {
      setIsDeleting(false);
      setDeleteTemplate(null);
    }
  };

  const mapToFormField = (field: TemplateField): FormField => ({
    id: field.id,
    field_name: field.field_name,
    field_label: field.field_label,
    field_type: field.field_type as FormField["field_type"],
    is_required: field.is_required,
    options: field.options,
    placeholder: field.placeholder,
    help_text: field.help_text,
    display_order: field.display_order,
  });

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Checklist Templates</h1>
          <p className="text-muted-foreground">
            Manage and preview your checklist templates
          </p>
        </div>
        <Button onClick={() => navigate("/checklist-builder")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No templates yet</h3>
            <p className="text-muted-foreground text-center mt-1">
              Create your first checklist template to get started
            </p>
            <Button className="mt-4" onClick={() => navigate("/checklist-builder")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates?.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{template.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {template.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground mb-4">
                  <Calendar className="mr-1 h-3 w-3" />
                  Created {format(new Date(template.created_at), "MMM d, yyyy")}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handlePreview(template)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(template)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTemplate(template)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Form Preview: {previewTemplate?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {previewTemplate?.description && (
              <p className="text-sm text-muted-foreground">{previewTemplate.description}</p>
            )}
            {previewFields.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No fields in this template
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {previewFields.map((field) => (
                  <DynamicFieldRenderer
                    key={field.id}
                    field={mapToFormField(field)}
                    value={previewValues[field.field_name]}
                    onChange={(value) =>
                      setPreviewValues((prev) => ({
                        ...prev,
                        [field.field_name]: value,
                      }))
                    }
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTemplate} onOpenChange={() => setDeleteTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTemplate?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
