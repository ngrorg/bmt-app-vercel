import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Upload, X, PenTool } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { RichTextDisplay } from "@/components/forms/RichTextEditor";

type FieldType = Database["public"]["Enums"]["field_type"];

export interface FormField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: FieldType;
  is_required: boolean;
  options: string[] | null;
  placeholder: string | null;
  help_text: string | null;
  display_order: number;
}

interface FieldRendererProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

// Helper component for field wrapper
function FieldWrapper({
  field,
  error,
  children,
  className,
}: {
  field: FormField;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className={cn(error && "text-destructive")}>
        {field.field_label}
        {field.is_required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {field.help_text && (
        <p className="text-xs text-muted-foreground">{field.help_text}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// Text Input Field
export function TextFieldRenderer({ field, value, onChange, error, disabled, className }: FieldRendererProps) {
  return (
    <FieldWrapper field={field} error={error} className={className}>
      <Input
        placeholder={field.placeholder || `Enter ${field.field_label.toLowerCase()}...`}
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(error && "border-destructive")}
      />
    </FieldWrapper>
  );
}

// Textarea Field
export function TextareaFieldRenderer({ field, value, onChange, error, disabled, className }: FieldRendererProps) {
  return (
    <FieldWrapper field={field} error={error} className={className}>
      <Textarea
        placeholder={field.placeholder || `Enter ${field.field_label.toLowerCase()}...`}
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={4}
        className={cn(error && "border-destructive")}
      />
    </FieldWrapper>
  );
}

// Number Field
export function NumberFieldRenderer({ field, value, onChange, error, disabled, className }: FieldRendererProps) {
  return (
    <FieldWrapper field={field} error={error} className={className}>
      <Input
        type="number"
        placeholder={field.placeholder || "0"}
        value={(value as number) ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        disabled={disabled}
        className={cn(error && "border-destructive")}
      />
    </FieldWrapper>
  );
}

// Date Field
export function DateFieldRenderer({ field, value, onChange, error, disabled, className }: FieldRendererProps) {
  const dateValue = value ? new Date(value as string) : undefined;

  return (
    <FieldWrapper field={field} error={error} className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateValue && "text-muted-foreground",
              error && "border-destructive"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateValue ? format(dateValue, "PPP") : field.placeholder || "Select a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(date) => onChange(date?.toISOString() || null)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </FieldWrapper>
  );
}

// Checkbox Field - Custom layout without duplicate label
export function CheckboxFieldRenderer({ field, value, onChange, error, disabled, className }: FieldRendererProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
        <Checkbox
          id={field.field_name}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(checked)}
          disabled={disabled}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        />
        <div className="flex-1 min-w-0">
          <label
            htmlFor={field.field_name}
            className={cn(
              "text-sm font-medium leading-relaxed cursor-pointer select-none block",
              error && "text-destructive"
            )}
          >
            {field.field_label}
            {field.is_required && <span className="text-destructive ml-1">*</span>}
          </label>
          {field.help_text && (
            <p className="text-xs text-muted-foreground mt-1">{field.help_text}</p>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// Radio Field
export function RadioFieldRenderer({ field, value, onChange, error, disabled, className }: FieldRendererProps) {
  const options = field.options || [];

  return (
    <FieldWrapper field={field} error={error} className={className}>
      <RadioGroup
        value={(value as string) || ""}
        onValueChange={onChange}
        disabled={disabled}
        className="space-y-2"
      >
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <RadioGroupItem value={option} id={`${field.field_name}-${option}`} />
            <Label
              htmlFor={`${field.field_name}-${option}`}
              className="font-normal cursor-pointer"
            >
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {options.length === 0 && (
        <p className="text-sm text-muted-foreground">No options configured</p>
      )}
    </FieldWrapper>
  );
}

// Select Field
export function SelectFieldRenderer({ field, value, onChange, error, disabled, className }: FieldRendererProps) {
  const options = field.options || [];

  return (
    <FieldWrapper field={field} error={error} className={className}>
      <Select
        value={(value as string) || ""}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger className={cn(error && "border-destructive")}>
          <SelectValue placeholder={field.placeholder || "Select an option..."} />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {options.length === 0 && (
        <p className="text-sm text-muted-foreground">No options configured</p>
      )}
    </FieldWrapper>
  );
}

// File Upload Field
export function FileFieldRenderer({ field, value, onChange, error, disabled, className }: FieldRendererProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileValue = value as { name: string; file?: File } | null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onChange({ name: file.name, file });
    }
  }

  function handleRemove() {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <FieldWrapper field={field} error={error} className={className}>
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        id={field.field_name}
      />
      {fileValue ? (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-sm truncate">{fileValue.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className={cn("w-full", error && "border-destructive")}
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <Upload className="h-4 w-4 mr-2" />
          {field.placeholder || "Upload file"}
        </Button>
      )}
    </FieldWrapper>
  );
}

// Signature Field
export function SignatureFieldRenderer({ field, value, onChange, error, disabled, className }: FieldRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const signatureValue = value as string | null;

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (disabled) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDrawing() {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL());
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onChange(null);
      }
    }
  }

  return (
    <FieldWrapper field={field} error={error} className={className}>
      <div className={cn("border rounded-lg overflow-hidden", error && "border-destructive")}>
        {signatureValue ? (
          <div className="relative">
            <img
              src={signatureValue}
              alt="Signature"
              className="w-full h-32 object-contain bg-white"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={clearSignature}
              disabled={disabled}
            >
              Clear
            </Button>
          </div>
        ) : (
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={400}
              height={128}
              className="w-full h-32 bg-white cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs text-muted-foreground pointer-events-none">
              <PenTool className="h-3 w-3" />
              {field.placeholder || "Sign here"}
            </div>
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}

// Paragraph Field (Display Only - no input required)
export function ParagraphFieldRenderer({ field, className }: FieldRendererProps) {
  // The content is stored in the help_text field for paragraph type
  const content = field.help_text || "";

  if (!content) {
    return null;
  }

  return (
    <div className={cn("py-2", className)}>
      <RichTextDisplay content={content} />
    </div>
  );
}

// Main renderer that picks the right component
export function DynamicFieldRenderer(props: FieldRendererProps) {
  const { field, className } = props;
  
  // Paragraph fields always render full width
  const isParagraph = field.field_type === "paragraph";
  const wrapperClass = cn(
    isParagraph && "col-span-full",
    className
  );

  const propsWithClass = { ...props, className: wrapperClass };

  switch (field.field_type) {
    case "text":
      return <TextFieldRenderer {...propsWithClass} />;
    case "textarea":
      return <TextareaFieldRenderer {...propsWithClass} />;
    case "number":
      return <NumberFieldRenderer {...propsWithClass} />;
    case "date":
      return <DateFieldRenderer {...propsWithClass} />;
    case "checkbox":
      return <CheckboxFieldRenderer {...propsWithClass} />;
    case "radio":
      return <RadioFieldRenderer {...propsWithClass} />;
    case "select":
      return <SelectFieldRenderer {...propsWithClass} />;
    case "file":
      return <FileFieldRenderer {...propsWithClass} />;
    case "signature":
      return <SignatureFieldRenderer {...propsWithClass} />;
    case "paragraph":
      return <ParagraphFieldRenderer {...propsWithClass} />;
    default:
      return <TextFieldRenderer {...propsWithClass} />;
  }
}
