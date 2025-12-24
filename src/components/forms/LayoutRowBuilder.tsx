import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GripVertical, LayoutGrid, Plus, Trash2 } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

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

export interface LayoutRow {
  id: string;
  columns: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  fieldIds: string[];
  order: number;
}

interface LayoutRowBuilderProps {
  layoutRow: LayoutRow;
  fields: TemplateField[];
  assignedFieldIds: Set<string>;
  onUpdate: (id: string, updates: Partial<LayoutRow>) => void;
  onRemove: (id: string) => void;
  index: number;
}

const columnOptions = [
  { value: "1", label: "1 Col" },
  { value: "2", label: "2 Col" },
  { value: "3", label: "3 Col" },
  { value: "4", label: "4 Col" },
];

const fieldTypeLabels: Record<FieldType, string> = {
  text: "Text",
  textarea: "Long Text",
  number: "Number",
  date: "Date",
  checkbox: "Checkbox",
  radio: "Radio (Yes/No)",
  select: "Dropdown",
  file: "Upload File",
  signature: "Signature",
  paragraph: "Paragraph",
};

export function LayoutRowBuilder({
  layoutRow,
  fields,
  assignedFieldIds,
  onUpdate,
  onRemove,
  index,
}: LayoutRowBuilderProps) {
  const handleColumnChange = (
    size: "sm" | "md" | "lg" | "xl",
    value: string
  ) => {
    onUpdate(layoutRow.id, {
      columns: {
        ...layoutRow.columns,
        [size]: parseInt(value),
      },
    });
  };

  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    const newFieldIds = checked
      ? [...layoutRow.fieldIds, fieldId]
      : layoutRow.fieldIds.filter((id) => id !== fieldId);
    onUpdate(layoutRow.id, { fieldIds: newFieldIds });
  };

  // Get available fields (unassigned or assigned to this layout)
  const availableFields = fields.filter(
    (field) =>
      !assignedFieldIds.has(field.id) || layoutRow.fieldIds.includes(field.id)
  );

  return (
    <Card className="border-l-4 border-l-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground cursor-grab hover:text-foreground">
              <GripVertical className="h-5 w-5" />
            </div>
            <CardTitle className="text-base flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Layout Row #{index + 1}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(layoutRow.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Column Configuration */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Columns per screen size
          </Label>
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">SM</Label>
              <Select
                value={layoutRow.columns.sm.toString()}
                onValueChange={(v) => handleColumnChange("sm", v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {columnOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">MD</Label>
              <Select
                value={layoutRow.columns.md.toString()}
                onValueChange={(v) => handleColumnChange("md", v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {columnOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">LG</Label>
              <Select
                value={layoutRow.columns.lg.toString()}
                onValueChange={(v) => handleColumnChange("lg", v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {columnOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">XL</Label>
              <Select
                value={layoutRow.columns.xl.toString()}
                onValueChange={(v) => handleColumnChange("xl", v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {columnOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Field Assignment */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Assign fields to this layout
          </Label>
          <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto bg-muted/30">
            {availableFields.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No fields available. Add fields first.
              </p>
            ) : (
              availableFields.map((field) => {
                const isChecked = layoutRow.fieldIds.includes(field.id);
                const isDisabled =
                  assignedFieldIds.has(field.id) && !isChecked;

                return (
                  <div
                    key={field.id}
                    className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                      isChecked ? "bg-primary/10" : "hover:bg-muted/50"
                    } ${isDisabled ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`layout-${layoutRow.id}-field-${field.id}`}
                        checked={isChecked}
                        disabled={isDisabled}
                        onCheckedChange={(checked) =>
                          handleFieldToggle(field.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`layout-${layoutRow.id}-field-${field.id}`}
                        className={`cursor-pointer ${
                          isDisabled ? "text-muted-foreground" : ""
                        }`}
                      >
                        {field.field_label || `Field ${field.display_order + 1}`}
                      </Label>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {fieldTypeLabels[field.field_type]}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Fields Summary */}
        {layoutRow.fieldIds.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {layoutRow.fieldIds.length} field
            {layoutRow.fieldIds.length !== 1 ? "s" : ""} in this layout
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface LayoutRowsManagerProps {
  layoutRows: LayoutRow[];
  fields: TemplateField[];
  onLayoutRowsChange: (rows: LayoutRow[]) => void;
}

export function LayoutRowsManager({
  layoutRows,
  fields,
  onLayoutRowsChange,
}: LayoutRowsManagerProps) {
  // Get all assigned field IDs across all layout rows
  const assignedFieldIds = new Set(
    layoutRows.flatMap((row) => row.fieldIds)
  );

  const addLayoutRow = () => {
    const newRow: LayoutRow = {
      id: crypto.randomUUID(),
      columns: { sm: 1, md: 1, lg: 1, xl: 1 },
      fieldIds: [],
      order: layoutRows.length,
    };
    onLayoutRowsChange([...layoutRows, newRow]);
  };

  const updateLayoutRow = (id: string, updates: Partial<LayoutRow>) => {
    onLayoutRowsChange(
      layoutRows.map((row) =>
        row.id === id ? { ...row, ...updates } : row
      )
    );
  };

  const removeLayoutRow = (id: string) => {
    onLayoutRowsChange(layoutRows.filter((row) => row.id !== id));
  };

  // Get unassigned fields
  const unassignedFields = fields.filter(
    (field) => !assignedFieldIds.has(field.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Responsive Layout Configuration
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Group fields into layout rows with custom column configurations
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addLayoutRow}>
          <Plus className="h-4 w-4 mr-1" />
          Add Layout Row
        </Button>
      </div>

      {layoutRows.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg py-8 text-center text-muted-foreground">
          <LayoutGrid className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No layout rows configured</p>
          <p className="text-xs mt-1">
            Each field will be displayed in a single-column layout by default
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={addLayoutRow}
            className="mt-3"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Layout Row
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {layoutRows.map((row, index) => (
            <LayoutRowBuilder
              key={row.id}
              layoutRow={row}
              fields={fields}
              assignedFieldIds={assignedFieldIds}
              onUpdate={updateLayoutRow}
              onRemove={removeLayoutRow}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Unassigned Fields Info */}
      {unassignedFields.length > 0 && layoutRows.length > 0 && (
        <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">
            <strong>{unassignedFields.length}</strong> field
            {unassignedFields.length !== 1 ? "s" : ""} not assigned to any
            layout (will use default single-column layout):
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {unassignedFields.map((field) => (
              <Badge key={field.id} variant="outline" className="text-xs">
                {field.field_label || `Field ${field.display_order + 1}`}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
