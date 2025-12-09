import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Search, Upload, FileText, ExternalLink, Loader2 } from "lucide-react";
import { UploadDocumentDialog } from "@/components/documents/UploadDocumentDialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface Document {
  id: string;
  title: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  department: string;
  policy_area: string;
  responsible_role: string;
  status: string;
  version: string;
  tags: string[];
  document_date: string | null;
  created_at: string;
  updated_at: string;
}

export default function Documents() {
  const { user, session } = useAuth();
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const canUpload = user?.role === "admin";

  const fetchDocuments = async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (departmentFilter && departmentFilter !== "all") {
        params.set("department", departmentFilter);
      }

      const { data, error } = await supabase.functions.invoke("list-documents", {
        body: null,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setDocuments(data.documents || []);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchDocuments();
    }
  }, [session]);

  const handleDocumentClick = async (doc: Document) => {
    try {
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.file_path, 3600);

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    } catch (error) {
      console.error("Error getting document URL:", error);
      toast.error("Failed to open document");
    }
  };

  const getStatusBadgeStatus = (status: string): "approved" | "pending" | "flagged" | "rejected" => {
    switch (status.toLowerCase()) {
      case "active":
        return "approved";
      case "draft":
        return "pending";
      case "under review":
        return "flagged";
      case "archived":
        return "rejected";
      default:
        return "pending";
    }
  };

  // Client-side filtering for immediate response
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.department.toLowerCase().includes(search.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(search.toLowerCase());

    const matchesDepartment =
      departmentFilter === "all" || doc.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  const uniqueDepartments = [...new Set(documents.map((d) => d.department))];

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground">
            Policies, procedures, and reference documents
          </p>
        </div>
        {canUpload && (
          <Button onClick={() => setUploadDialogOpen(true)} className="shrink-0">
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        )}
      </div>

      {/* Upload Dialog */}
      <UploadDocumentDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={fetchDocuments}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-11 shrink-0">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {uniqueDepartments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-1">No documents found</h3>
            <p className="text-muted-foreground">
              {search || departmentFilter !== "all"
                ? "Try adjusting your filters"
                : "Upload your first document to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Documents List */
        <div className="space-y-3">
          {filteredDocs.map((doc) => (
            <Card
              key={doc.id}
              className="hover:shadow-elevated transition-shadow cursor-pointer overflow-hidden"
              onClick={() => handleDocumentClick(doc)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="hidden sm:flex w-10 h-10 rounded-lg bg-secondary items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{doc.title}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">
                          {doc.policy_area} • {doc.version} • Updated{" "}
                          {format(new Date(doc.updated_at), "dd MMM yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <StatusBadge status={getStatusBadgeStatus(doc.status)} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 sm:hidden"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDocumentClick(doc);
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground">
                        {doc.department}
                      </span>
                      <span className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground">
                        {doc.responsible_role}
                      </span>
                      {doc.tags?.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-primary/10 rounded-md text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 hidden sm:flex"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDocumentClick(doc);
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
