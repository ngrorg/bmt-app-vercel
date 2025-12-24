import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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
  FileText,
  ChevronDown,
  Settings2,
  Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database, Json } from "@/integrations/supabase/types";
import { LayoutRow } from "@/components/forms/LayoutRowBuilder";
import { DynamicFieldRenderer, FormField } from "@/components/forms/DynamicFieldRenderer";
import { RichTextEditor } from "@/components/forms/RichTextEditor";

type FieldType = Database["public"]["Enums"]["field_type"];

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
  paragraph: <FileText className="h-4 w-4" />,
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
  paragraph: "Paragraph (Display Only)",
};

export default function EditChecklistTemplate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("templateId");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Template info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Form fields
  const [fields, setFields] = useState<TemplateField[]>([]);

  // Layout rows
  const [layoutRows, setLayoutRows] = useState<LayoutRow[]>([]);

  // Preview
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    } else {
      navigate("/checklist-templates");
    }
  }, [templateId, navigate]);

  async function loadTemplate(id: string) {
    try {
      setIsLoadingData(true);

      const { data: template, error: templateError } = await supabase
        .from("checklist_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (templateError) throw templateError;

      const { data: templateFields, error: fieldsError } = await supabase
        .from("checklist_template_fields")
        .select("*")
        .eq("template_id", id)
        .order("display_order");

      if (fieldsError) throw fieldsError;

      // Populate form
      setTitle(template.title);
      setDescription(template.description || "");
      setFields(
        (templateFields || []).map((f) => ({
          id: f.id,
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

    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Failed to load template");
      navigate("/checklist-templates");
    } finally {
      setIsLoadingData(false);
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

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error("Please enter a title for the checklist");
      return;
    }

    if (fields.length === 0) {
      toast.error("Please add at least one field");
      return;
    }

    const emptyLabels = fields.filter(f => f.field_type !== "paragraph" && !f.field_label.trim());
    if (emptyLabels.length > 0) {
      toast.error("Please fill in all field labels");
      return;
    }

    if (!templateId) {
      toast.error("Template ID is missing");
      return;
    }

    try {
      setIsLoading(true);

      // Update the template
      const { error: templateError } = await supabase
        .from("checklist_templates")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          layout_config: layoutRows as unknown as Json,
        })
        .eq("id", templateId);

      if (templateError) throw templateError;

      // Delete existing fields
      const { error: deleteError } = await supabase
        .from("checklist_template_fields")
        .delete()
        .eq("template_id", templateId);

      if (deleteError) throw deleteError;

      // Insert updated fields
      const fieldsToInsert = fields.map((f, index) => ({
        template_id: templateId,
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

      toast.success("Template updated successfully");
      navigate("/checklist-templates");
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Failed to update template");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingData) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/checklist-templates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Edit Template
          </h1>
          <p className="text-muted-foreground">
            Update checklist template fields and settings
          </p>
        </div>
      </div>

      {/* Template Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Vehicle Inspection Checklist"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
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
                        {/* Paragraph field - simplified UI */}
                        {field.field_type === "paragraph" ? (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="gap-1">
                                {fieldTypeIcons[field.field_type]}
                                {fieldTypeLabels[field.field_type]}
                              </Badge>
                              <Select
                                value={field.field_type}
                                onValueChange={(v) => updateField(field.id, { field_type: v as FieldType })}
                              >
                                <SelectTrigger className="w-auto h-7 text-xs">
                                  <span className="text-muted-foreground">Change type</span>
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
                            <div className="space-y-2">
                              <Label className="text-sm text-muted-foreground">
                                Content (displayed as read-only text in the form)
                              </Label>
                              <RichTextEditor
                                value={field.help_text || ""}
                                onChange={(content) => updateField(field.id, { 
                                  help_text: content,
                                  field_label: "Paragraph",
                                  field_name: `paragraph_${field.id.slice(0, 8)}`
                                })}
                                placeholder="Enter notes, instructions, or other display-only content..."
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Basic Fields for non-paragraph types */}
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
                                <Label>Options</Label>
                                <div className="space-y-2">
                                  {(field.options || []).map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex items-center gap-2">
                                      <Input
                                        placeholder={`Option ${optionIndex + 1}`}
                                        value={option}
                                        onChange={(e) => {
                                          const newOptions = [...(field.options || [])];
                                          newOptions[optionIndex] = e.target.value;
                                          updateField(field.id, { options: newOptions });
                                        }}
                                        className="flex-1"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                          const newOptions = (field.options || []).filter((_, i) => i !== optionIndex);
                                          updateField(field.id, { options: newOptions.length > 0 ? newOptions : null });
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newOptions = [...(field.options || []), ""];
                                      updateField(field.id, { options: newOptions });
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Option
                                  </Button>
                                </div>
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

                              {/* Advanced Settings Collapsible Trigger - hide for radio/checkbox */}
                              {field.field_type !== "radio" && field.field_type !== "checkbox" && (
                                <Collapsible open={field.isExpanded} onOpenChange={() => toggleFieldExpanded(field.id)}>
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                                      <Settings2 className="h-4 w-4 mr-1" />
                                      Advanced Settings
                                      <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${field.isExpanded ? "rotate-180" : ""}`} />
                                    </Button>
                                  </CollapsibleTrigger>
                                </Collapsible>
                              )}
                            </div>

                            {/* Advanced Settings Content - hide for radio/checkbox */}
                            {field.field_type !== "radio" && field.field_type !== "checkbox" && (
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
                            )}
                          </>
                        )}
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
          <div className="flex items-center justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fixed Action Bar */}
      <div className="py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPreviewOpen(true)}
            disabled={fields.length === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>

          <div className="flex items-center gap-3">
            <Link to="/checklist-templates">
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Template
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
