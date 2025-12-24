import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Download, Eye, CheckCircle, XCircle, Flag, FileText } from "lucide-react";
import { format } from "date-fns";
import { SubmissionReviewDialog } from "@/components/tasks/SubmissionReviewDialog";
import { toast } from "sonner";
import { Tables, Json } from "@/integrations/supabase/types";
import { SubmissionWithDetails } from "@/types";

export default function Submissions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | "flag">("approve");

  const canReview = ["admin", "warehouse", "executive", "operational_lead"].includes(
    user?.role || ""
  );

  // Fetch submissions with related task attachment and task data
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_submissions")
        .select(`
          id,
          status,
          created_at,
          submitted_by_name,
          form_data,
          file_path,
          file_name,
          task_attachment:task_attachment_id (
            id,
            title,
            attachment_type,
            assigned_to,
            task:task_id (
              id,
              docket_number,
              customer_name,
              delivery_address
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching submissions:", error);
        toast.error("Failed to load submissions");
        throw error;
      }

      return (data || []) as unknown as SubmissionWithDetails[];
    },
  });

  const filteredSubmissions = submissions.filter((sub) => {
    const taskDocket = sub.task_attachment?.task?.docket_number || "";
    const attachmentTitle = sub.task_attachment?.title || "";
    const submitterName = sub.submitted_by_name || "";
    const customerName = sub.task_attachment?.task?.customer_name || "";
    const deliveryAddress = sub.task_attachment?.task?.delivery_address || "";
    const assignedTo = sub.task_attachment?.assigned_to || "";

    const matchesSearch =
      taskDocket.toLowerCase().includes(search.toLowerCase()) ||
      attachmentTitle.toLowerCase().includes(search.toLowerCase()) ||
      submitterName.toLowerCase().includes(search.toLowerCase()) ||
      customerName.toLowerCase().includes(search.toLowerCase()) || 
      deliveryAddress.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || sub.status === statusFilter;

    const matchesDepartment =
      departmentFilter === "all" || assignedTo === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const handleOpenReview = (submission: SubmissionWithDetails, action: "approve" | "reject" | "flag" | "view") => {
    setSelectedSubmission(submission);
    setReviewAction(action === "view" ? "approve" : action);
    setReviewDialogOpen(true);
  };

  const handleReviewSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["submissions"] });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy");
    } catch {
      return dateString;
    }
  };

  const getDepartmentLabel = (assignedTo: string | undefined) => {
    if (!assignedTo) return "—";
    return assignedTo === "transport" ? "Transport" : "Warehouse";
  };

  const exportToCSV = () => {
    const headers = ["Task Docket", "Department", "Type", "Submitted By", "Date", "Status"];
    const rows = filteredSubmissions.map((sub) => [
      sub.task_attachment?.task?.docket_number || "—",
      getDepartmentLabel(sub.task_attachment?.assigned_to),
      sub.task_attachment?.title || "—",
      sub.submitted_by_name || "—",
      formatDate(sub.created_at),
      sub.status,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submissions_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-11 flex-1" />
          <Skeleton className="h-11 w-40" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Submissions</h1>
          <p className="text-muted-foreground">
            {filteredSubmissions.length} checklist submissions
          </p>
        </div>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by docket, type, or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-11">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="transport">Transport</SelectItem>
            <SelectItem value="warehouse">Warehouse</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-11">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Empty State */}
      {filteredSubmissions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No submissions found</h3>
            <p className="text-muted-foreground">
              {search || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Submissions will appear here when users submit checklists or documents"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submissions List - Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredSubmissions.map((sub) => (
          <Card key={sub.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="font-mono text-sm font-semibold text-accent">
                    {sub.task_attachment?.task?.docket_number || "—"}
                  </span>
                  <p className="font-medium mt-1">{sub.task_attachment?.title || "—"}</p>
                </div>
                <StatusBadge status={sub.status} />
              </div>
              <div className="text-sm text-muted-foreground mb-3">
                <p>{sub.submitted_by_name || "Unknown"}</p>
                <p>
                  {getDepartmentLabel(sub.task_attachment?.assigned_to)} • {formatDate(sub.created_at)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenReview(sub, "view")}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                { canReview && sub.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-success"
                      onClick={() => handleOpenReview(sub, "approve")}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleOpenReview(sub, "reject")}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-warning"
                      onClick={() => handleOpenReview(sub, "flag")}
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submissions Table - Desktop */}
      {filteredSubmissions.length > 0 && (
        <Card className="hidden lg:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Task Docket
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Department
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Submitted By
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-semibold text-accent">
                          {sub.task_attachment?.task?.docket_number ? `Docket# ${sub.task_attachment?.task?.docket_number}` : "-"}
                          <br/>{sub.task_attachment?.task?.customer_name ? `Customer# ${sub.task_attachment?.task?.customer_name}` : ""}
                          <br/>{sub.task_attachment?.task?.delivery_address ? `Delivery# ${sub.task_attachment?.task?.delivery_address}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getDepartmentLabel(sub.task_attachment?.assigned_to)}
                      </td>
                      <td className="px-4 py-3 text-sm">{sub.task_attachment?.title || "—"}</td>
                      <td className="px-4 py-3 text-sm">{sub.submitted_by_name || "Unknown"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(sub.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenReview(sub, "view")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          { canReview && sub.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-success hover:text-success"
                                onClick={() => handleOpenReview(sub, "approve")}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleOpenReview(sub, "reject")}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-warning hover:text-warning"
                                onClick={() => handleOpenReview(sub, "flag")}
                              >
                                <Flag className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      {selectedSubmission && (
        <SubmissionReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          submission={selectedSubmission}
          taskTitle={selectedSubmission.task_attachment?.task?.docket_number || "Task"}
          attachmentTitle={selectedSubmission.task_attachment?.title || "Submission"}
          taskId={selectedSubmission.task_attachment?.task?.id}
          initialAction={reviewAction}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}
