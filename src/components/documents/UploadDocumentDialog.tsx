import { useState, useRef, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, FileText, Tag, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  title: z.string().min(1, "Document name is required").max(200),
  department: z.string().min(1, "Department is required"),
  policyArea: z.string().min(1, "Policy area is required"),
  responsibleRole: z.string().min(1, "Responsible role is required"),
  status: z.string().min(1, "Status is required"),
  version: z.string().min(1, "Version is required"),
  documentDate: z.date({ required_error: "Date is required" }),
});

type FormValues = z.infer<typeof formSchema>;

const departments = ["Warehouse", "Transport", "Operations", "Administration", "Finance", "HR"];
const policyAreas = ["Quality Control", "Safety", "Compliance", "Operations", "HR", "Environment", "Maintenance", "Personal"];
const roles = ["Admin", "Driver", "Warehouse", "Executive", "Operational Lead", "Logistics", "HR Manager"];
const statuses = ["Active", "Draft", "Under Review", "Archived"];
const versions = ["v1.0", "v1.1", "v1.2", "v2.0", "v2.1", "v3.0"];

// Abbreviation mappings for standardized naming
const departmentAbbreviations: Record<string, string> = {
  "Warehouse": "Warehouse",
  "Transport": "Trans",
  "Operations": "Ops",
  "Administration": "Admin",
  "Finance": "Fin",
  "HR": "HR",
};

const policyAreaAbbreviations: Record<string, string> = {
  "Quality Control": "QC",
  "Safety": "Safety",
  "Compliance": "Comp",
  "Operations": "Ops",
  "HR": "HR",
  "Environment": "Env",
  "Maintenance": "Maint",
  "Personal": "Personal",
};

const roleAbbreviations: Record<string, string> = {
  "Admin": "Admin",
  "Driver": "Driver",
  "Warehouse": "Warehouse",
  "Executive": "Exec",
  "Operational Lead": "OpsLead",
  "Logistics": "Logistics",
  "HR Manager": "HRMgr",
};

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UploadDocumentDialog({
  open,
  onOpenChange,
  onSuccess,
}: UploadDocumentDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      department: "",
      policyArea: "",
      responsibleRole: "",
      status: "Active",
      version: "v1.0",
      documentDate: new Date(),
    },
  });

  // Watch form values for auto-generated filename preview
  const watchedValues = useWatch({ control: form.control });

  // Generate standardized filename
  // Format: Department_PolicyArea_Responsible_DocumentName_DDMMYYYY_vX.X
  const generatedFilename = useMemo(() => {
    const { department, policyArea, responsibleRole, title, documentDate, version } = watchedValues;
    
    if (!department || !policyArea || !responsibleRole || !title || !documentDate) {
      return null;
    }

    const deptAbbr = departmentAbbreviations[department] || department.replace(/\s+/g, "");
    const policyAbbr = policyAreaAbbreviations[policyArea] || policyArea.replace(/\s+/g, "");
    const roleAbbr = roleAbbreviations[responsibleRole] || responsibleRole.replace(/\s+/g, "");
    const titleClean = title.replace(/\s+/g, "").substring(0, 20);
    const dateStr = format(documentDate, "ddMMyyyy");
    
    return `${deptAbbr}_${policyAbbr}_${roleAbbr}_${titleClean}_${dateStr}_${version}`;
  }, [watchedValues]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!form.getValues("title")) {
        form.setValue("title", selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate standardized filename
      const deptAbbr = departmentAbbreviations[values.department] || values.department.replace(/\s+/g, "");
      const policyAbbr = policyAreaAbbreviations[values.policyArea] || values.policyArea.replace(/\s+/g, "");
      const roleAbbr = roleAbbreviations[values.responsibleRole] || values.responsibleRole.replace(/\s+/g, "");
      const titleClean = values.title.replace(/\s+/g, "").substring(0, 20);
      const dateStr = format(values.documentDate, "ddMMyyyy");
      const fileExt = file.name.split(".").pop() || "pdf";
      
      const standardizedFilename = `${deptAbbr}_${policyAbbr}_${roleAbbr}_${titleClean}_${dateStr}_${values.version}.${fileExt}`;
      const filePath = `${values.department.toLowerCase()}/${standardizedFilename}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Insert document record with standardized filename
      const { error: insertError } = await supabase.from("documents").insert({
        title: standardizedFilename.replace(`.${fileExt}`, ""),
        file_path: filePath,
        file_name: standardizedFilename,
        file_size: file.size,
        mime_type: file.type,
        department: values.department,
        policy_area: values.policyArea,
        responsible_role: values.responsibleRole,
        status: values.status.toLowerCase(),
        version: values.version,
        tags: tags,
        document_date: format(values.documentDate, "yyyy-MM-dd"),
      });

      if (insertError) throw insertError;

      toast.success("Document uploaded successfully");
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setFile(null);
    setTags([]);
    setTagInput("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Document Upload Form</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <FormLabel>Choose File</FormLabel>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <span className="text-sm">Click to select a file</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              />
            </div>

            {/* Department and Policy Area */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="policyArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Area</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select policy area" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {policyAreas.map((area) => (
                          <SelectItem key={area} value={area}>
                            {area}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Responsible Role and Document Name */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="responsibleRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsible (Role/User)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Name (Short)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CleanCert" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date and Version */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="documentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date Created</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Choose date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version (Auto)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select version" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {versions.map((version) => (
                          <SelectItem key={version} value={version}>
                            {version}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Document Type and Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Auto-Generated Filename Preview */}
            {generatedFilename && (
              <div className="space-y-2">
                <FormLabel>Auto-Generated Filename (Preview)</FormLabel>
                <div className="p-3 bg-muted rounded-lg border">
                  <code className="text-sm font-mono text-primary break-all">
                    {generatedFilename}
                  </code>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="space-y-2">
              <FormLabel>Add tags, dept*</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  className="gap-2"
                >
                  <Tag className="h-4 w-4" />
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                <FileText className="h-4 w-4" />
                {isSubmitting ? "Uploading..." : "Upload Document"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
