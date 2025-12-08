import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  ArrowLeft,
  ClipboardList, 
  Loader2, 
  Plus, 
  Trash2, 
  GripVertical,
  Type,
  AlignLeft,
  Hash,
  Calendar,
  CheckSquare,
  Circle,
  List,
  Upload,
  PenTool,
  Save,
  Pencil,
  FileText,
  Copy,
  ChevronDown,
  Settings2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database, Tables, Json } from "@/integrations/supabase/types";
import { LayoutRowsManager, LayoutRow } from "@/components/forms/LayoutRowBuilder";
import { DynamicFieldRenderer, FormField } from "@/components/forms/DynamicFieldRenderer";
import { Eye } from "lucide-react";

type FieldType = Database["public"]["Enums"]["field_type"];
type DepartmentType = Database["public"]["Enums"]["department_type"];
type ChecklistTemplate = Tables<"checklist_templates">;
type TaskAttachment = Tables<"task_attachments"> & {
  checklist_templates?: { title: string; description: string | null } | null;
};

interface TemplateField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: FieldType;
  is_required: boolean;
  options: string[] | null;
  placeholder: string | null;
  help_text: string | null;
  display_order: number;
  isExpanded?: boolean;
}

const fieldTypeIcons: Record<FieldType, React.ReactNode> = {
  text: <Type className="h-4 w-4" />,
  textarea: <AlignLeft className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  checkbox: <CheckSquare className="h-4 w-4" />,
  radio: <Circle className="h-4 w-4" />,
  select: <List className="h-4 w-4" />,
  file: <Upload className="h-4 w-4" />,
  signature: <PenTool className="h-4 w-4" />,
};

const fieldTypeLabels: Record<FieldType, string> = {
  text: "Text Input",
  textarea: "Long Text",
  number: "Number",
  date: "Date",
  checkbox: "Checkbox",
  radio: "Radio Options",
  select: "Dropdown",
  file: "File Upload",
  signature: "Signature",
};

export default function ChecklistBuilder() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Existing data
  const [existingAttachments, setExistingAttachments] = useState<TaskAttachment[]>([]);
  const [existingTemplates, setExistingTemplates] = useState<ChecklistTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Editing mode
  const [editingAttachmentId, setEditingAttachmentId] = useState<string | null>(null);

  // Template info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [assignedTo, setAssignedTo] = useState<DepartmentType>("transport");

  // Form fields
  const [fields, setFields] = useState<TemplateField[]>([]);

  // Layout rows
  const [layoutRows, setLayoutRows] = useState<LayoutRow[]>([]);

  // Preview
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    fetchData();
  }, [taskId]);

  async function fetchData() {
    try {
      setIsLoadingData(true);

      // Fetch existing checklist attachments for this task
      if (taskId) {
        const { data: attachments, error: attachmentsError } = await supabase
          .from("task_attachments")
          .select(`
            *,
            checklist_templates (title, description)
          `)
          .eq("task_id", taskId)
          .eq("attachment_type", "checklist")
          .order("created_at", { ascending: true });

        if (attachmentsError) throw attachmentsError;
        setExistingAttachments(attachments || []);
      }

      // Fetch all existing templates
      const { data: templates, error: templatesError } = await supabase
        .from("checklist_templates")
        .select("*")
        .order("title");

      if (templatesError) throw templatesError;
      setExistingTemplates(templates || []);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoadingData(false);
    }
  }

  async function loadTemplateFields(templateId: string) {
    try {
      const { data: template, error: templateError } = await supabase
        .from("checklist_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError) throw templateError;

      const { data: templateFields, error: fieldsError } = await supabase
        .from("checklist_template_fields")
        .select("*")
        .eq("template_id", templateId)
        .order("display_order");

      if (fieldsError) throw fieldsError;

      // Populate form
      setTitle(template.title);
      setDescription(template.description || "");
      setFields(
        (templateFields || []).map((f) => ({
          id: crypto.randomUUID(),
          field_name: f.field_name,
          field_label: f.field_label,
          field_type: f.field_type,
          is_required: f.is_required,
          options: f.options as string[] | null,
          placeholder: f.placeholder,
          help_text: f.help_text,
          display_order: f.display_order,
          isExpanded: false,
        }))
      );

      // Load layout config if available
      const layoutConfig = template.layout_config as unknown as LayoutRow[] | null;
      setLayoutRows(Array.isArray(layoutConfig) ? layoutConfig : []);

      toast.success("Template loaded - make your changes");
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Failed to load template");
    }
  }

  function handleTemplateSelect(templateId: string) {
    setSelectedTemplateId(templateId);
    if (templateId) {
      loadTemplateFields(templateId);
      setEditingAttachmentId(null);
    }
  }

  async function handleEditAttachment(attachment: TaskAttachment) {
    if (attachment.checklist_template_id) {
      setEditingAttachmentId(attachment.id);
      setSelectedTemplateId(attachment.checklist_template_id);
      setIsRequired(attachment.is_required);
      await loadTemplateFields(attachment.checklist_template_id);
    }
  }

  function addField() {
    const newField: TemplateField = {
      id: crypto.randomUUID(),
      field_name: `field_${fields.length + 1}`,
      field_label: "",
      field_type: "text",
      is_required: false,
      options: null,
      placeholder: null,
      help_text: null,
      display_order: fields.length,
      isExpanded: true,
    };
    setFields([...fields, newField]);
  }

  function updateField(id: string, updates: Partial<TemplateField>) {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  }

  function removeField(id: string) {
    setFields(fields.filter(f => f.id !== id));
  }

  function toggleFieldExpanded(id: string) {
    setFields(fields.map(f => f.id === id ? { ...f, isExpanded: !f.isExpanded } : f));
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setIsRequired(false);
    setAssignedTo("transport");
    setFields([]);
    setLayoutRows([]);
    setSelectedTemplateId("");
    setEditingAttachmentId(null);
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error("Please enter a title for the checklist");
      return;
    }

    if (fields.length === 0) {
      toast.error("Please add at least one field");
      return;
    }

    const emptyLabels = fields.filter(f => !f.field_label.trim());
    if (emptyLabels.length > 0) {
      toast.error("Please fill in all field labels");
      return;
    }

    try {
      setIsLoading(true);

      // Create the template
      const { data: template, error: templateError } = await supabase
        .from("checklist_templates")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          layout_config: layoutRows as unknown as Json,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Create the fields
      const fieldsToInsert = fields.map((f, index) => ({
        template_id: template.id,
        field_name: f.field_name || `field_${index + 1}`,
        field_label: f.field_label,
        field_type: f.field_type,
        is_required: f.is_required,
        options: f.options,
        placeholder: f.placeholder,
        help_text: f.help_text,
        display_order: index,
      }));

      const { error: fieldsError } = await supabase
        .from("checklist_template_fields")
        .insert(fieldsToInsert);

      if (fieldsError) throw fieldsError;

      // If editing an existing attachment, update it
      if (editingAttachmentId) {
        const { error: updateError } = await supabase
          .from("task_attachments")
          .update({
            title: title.trim(),
            checklist_template_id: template.id,
            is_required: isRequired,
            assigned_to: assignedTo,
          })
          .eq("id", editingAttachmentId);

        if (updateError) throw updateError;

        toast.success("Checklist updated");
      } else if (taskId) {
        // Create new attachment
        const { error: attachmentError } = await supabase
          .from("task_attachments")
          .insert({
            task_id: taskId,
            attachment_type: "checklist",
            title: title.trim(),
            checklist_template_id: template.id,
            is_required: isRequired,
            assigned_to: assignedTo,
          });

        if (attachmentError) throw attachmentError;

        toast.success("Checklist created and added to task");
      } else {
        toast.success("Checklist template created");
      }

      navigate(`/tasks/${taskId}`);
    } catch (error) {
      console.error("Error creating checklist:", error);
      toast.error("Failed to create checklist");
    } finally {
      setIsLoading(false);
    }
  }

  const backUrl = taskId ? `/tasks/${taskId}` : "/settings";

  if (isLoadingData) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={backUrl}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            {editingAttachmentId ? "Edit Checklist" : "Create Checklist"}
          </h1>
          <p className="text-muted-foreground">
            {taskId ? "Build a custom checklist form for this task" : "Create a reusable checklist template"}
          </p>
        </div>
      </div>

      {/* Existing Attachments */}
      {existingAttachments.length > 0 && (
        <Card className="py-2">
          <CardContent className="py-2">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Existing Checklists ({existingAttachments.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {existingAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors cursor-pointer ${
                    editingAttachmentId === attachment.id
                      ? "border-primary bg-primary/10"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => handleEditAttachment(attachment)}
                >
                  <ClipboardList className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">{attachment.title}</span>
                  {attachment.is_required && (
                    <Badge variant="outline" className="text-xs py-0 px-1.5">Required</Badge>
                  )}
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Use Existing Template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Start from Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>Select an existing template to use as starting point</Label>
            <div className="flex gap-3">
              <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Choose a template to copy..." />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {existingTemplates.map((template) => (
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
              {(title || fields.length > 0) && (
                <Button variant="outline" onClick={resetForm}>
                  Clear Form
                </Button>
              )}
            </div>
            {existingTemplates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No existing templates. Build one from scratch below.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Template Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Checklist Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Vehicle Inspection Checklist"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            {taskId && (
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
              </div>
            )}
          </div>
          {taskId && (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="flex-1">
                <Label htmlFor="required">Required for Task</Label>
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
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of what this checklist is for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Fields Builder */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Form Fields</CardTitle>
          <Button type="button" variant="outline" onClick={addField}>
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg py-12 text-center text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No fields added yet</p>
              <p className="text-sm mt-1">Click "Add Field" to start building your form</p>
              <Button type="button" variant="outline" onClick={addField} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add First Field
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="border-l-4 border-l-primary/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Drag Handle & Order */}
                      <div className="flex flex-col items-center gap-1 pt-2">
                        <div className="text-muted-foreground cursor-grab hover:text-foreground">
                          <GripVertical className="h-5 w-5" />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          #{index + 1}
                        </span>
                      </div>

                      {/* Field Configuration */}
                      <div className="flex-1 space-y-4">
                        {/* Basic Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Field Label *</Label>
                            <Input
                              placeholder="e.g., Driver Name, Vehicle Number..."
                              value={field.field_label}
                              onChange={(e) => updateField(field.id, { 
                                field_label: e.target.value,
                                field_name: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Field Type</Label>
                            <Select
                              value={field.field_type}
                              onValueChange={(v) => updateField(field.id, { field_type: v as FieldType })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-popover z-50">
                                {(Object.keys(fieldTypeLabels) as FieldType[]).map((type) => (
                                  <SelectItem key={type} value={type}>
                                    <div className="flex items-center gap-2">
                                      {fieldTypeIcons[type]}
                                      <span>{fieldTypeLabels[type]}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Options for radio/select */}
                        {(field.field_type === "radio" || field.field_type === "select") && (
                          <div className="space-y-2">
                            <Label>Options (comma-separated)</Label>
                            <Input
                              placeholder="Option 1, Option 2, Option 3"
                              value={field.options?.join(", ") || ""}
                              onChange={(e) => updateField(field.id, { 
                                options: e.target.value.split(",").map(o => o.trim()).filter(Boolean)
                              })}
                            />
                          </div>
                        )}

                        {/* Required Toggle & Advanced Settings */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`required-${field.id}`}
                              checked={field.is_required}
                              onCheckedChange={(checked) => updateField(field.id, { is_required: checked })}
                            />
                            <Label htmlFor={`required-${field.id}`} className="text-sm cursor-pointer">
                              Required field
                            </Label>
                          </div>

                          {/* Advanced Settings Collapsible Trigger */}
                          <Collapsible open={field.isExpanded} onOpenChange={() => toggleFieldExpanded(field.id)}>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-muted-foreground">
                                <Settings2 className="h-4 w-4 mr-1" />
                                Advanced Settings
                                <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${field.isExpanded ? "rotate-180" : ""}`} />
                              </Button>
                            </CollapsibleTrigger>
                          </Collapsible>
                        </div>

                        {/* Advanced Settings Content */}
                        <Collapsible open={field.isExpanded} onOpenChange={() => toggleFieldExpanded(field.id)}>
                          <CollapsibleContent className="pt-2 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Placeholder Text</Label>
                                <Input
                                  placeholder="Text shown when field is empty..."
                                  value={field.placeholder || ""}
                                  onChange={(e) => updateField(field.id, { placeholder: e.target.value || null })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Help Text</Label>
                                <Input
                                  placeholder="Additional instructions for the user..."
                                  value={field.help_text || ""}
                                  onChange={(e) => updateField(field.id, { help_text: e.target.value || null })}
                                />
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>

                      {/* Delete Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeField(field.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add More Button */}
              <Button 
                type="button" 
                variant="outline" 
                onClick={addField}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Field
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Layout Configuration - Hidden for now, using default 2-col layout for md+ screens */}
      {/* {fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Layout Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <LayoutRowsManager
              layoutRows={layoutRows}
              fields={fields}
              onLayoutRowsChange={setLayoutRows}
            />
          </CardContent>
        </Card>
      )} */}

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Form Preview: {title || "Untitled Checklist"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            {fields.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No fields to preview. Add some fields first.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field) => (
                  <DynamicFieldRenderer
                    key={field.id}
                    field={field as FormField}
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
          {/* Preview Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => setIsPreviewOpen(false)}>
                Save as Draft
              </Button>
              <Button onClick={() => setIsPreviewOpen(false)}>
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 fixed bottom-4 left-4 right-4 max-w-4xl mx-auto p-4 bg-background/95 backdrop-blur border rounded-lg shadow-lg z-10">
        <p className="text-sm text-muted-foreground">
          {fields.length} field{fields.length !== 1 ? "s" : ""} added
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setPreviewValues({});
              setIsPreviewOpen(true);
            }}
            disabled={fields.length === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Link to={backUrl}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !title.trim() || fields.length === 0}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {editingAttachmentId ? "Update Checklist" : taskId ? "Create & Add to Task" : "Create Template"}
          </Button>
        </div>
      </div>
    </div>
  );
}
