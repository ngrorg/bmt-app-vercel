import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PullToRefreshContainer } from "@/components/ui/pull-to-refresh";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import {
  ClipboardCheck,
  FileText,
  CheckCircle,
  XCircle,
  Flag,
  Clock,
  Send,
  RefreshCw,
  MessageSquare,
  ChevronRight,
  Inbox,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { ChecklistSubmissionDialog } from "@/components/tasks/ChecklistSubmissionDialog";
import { DocumentUploadDialog } from "@/components/tasks/DocumentUploadDialog";
import { format } from "date-fns";

type TaskSubmission = Tables<"task_submissions">;
type TaskAttachment = Tables<"task_attachments"> & {
  submissions?: TaskSubmission[];
  checklist_template?: { id: string; title: string } | null;
  task?: { id: string; docket_number: string; customer_name: string } | null;
};

type FilterStatus = "all" | "action_required" | "pending" | "submitted" | "approved";

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-muted text-muted-foreground",
  },
  submitted: {
    label: "Submitted",
    icon: Send,
    className: "bg-info/10 text-info",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    className: "bg-success/10 text-success",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive",
  },
  flagged: {
    label: "Flagged",
    icon: Flag,
    className: "bg-warning/10 text-warning",
  },
};

const filterTabs: { value: FilterStatus; label: string; icon: typeof Clock }[] = [
  { value: "all", label: "All", icon: ClipboardCheck },
  { value: "action_required", label: "Action Required", icon: AlertTriangle },
  { value: "pending", label: "Pending", icon: Clock },
  { value: "submitted", label: "Awaiting Review", icon: Send },
  { value: "approved", label: "Approved", icon: CheckCircle },
];

export default function Checklists() {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAttachment, setSelectedAttachment] = useState<TaskAttachment | null>(null);
  const [dialogType, setDialogType] = useState<"checklist" | "document" | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");

  // Determine assigned_to filter based on user role
  const assignedToFilter = user?.role === "warehouse" ? "warehouse" : "transport";

  // Refresh function for pull-to-refresh
  const handleRefresh = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("task_attachments")
        .select(`
          *,
          task:tasks!task_attachments_task_id_fkey(id, docket_number, customer_name),
          checklist_template:checklist_templates(id, title),
          submissions:task_submissions(*)
        `)
        .eq("assigned_to", assignedToFilter)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const processedData = (data || []).map((attachment) => ({
        ...attachment,
        submissions: attachment.submissions?.sort(
          (a: TaskSubmission, b: TaskSubmission) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      }));

      setAttachments(processedData);
    } catch (error) {
      console.error("Error refreshing submissions:", error);
    }
  }, [user?.id, assignedToFilter]);

  // Pull to refresh hook
  const { containerRef, pullDistance, progress, isRefreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
    disabled: isLoading,
  });

  useEffect(() => {
    if (user?.id) {
      fetchSubmissions();
    }
  }, [user?.id, assignedToFilter]);

  async function fetchSubmissions() {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("task_attachments")
        .select(`
          *,
          task:tasks!task_attachments_task_id_fkey(id, docket_number, customer_name),
          checklist_template:checklist_templates(id, title),
          submissions:task_submissions(*)
        `)
        .eq("assigned_to", assignedToFilter)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const processedData = (data || []).map((attachment) => ({
        ...attachment,
        submissions: attachment.submissions?.sort(
          (a: TaskSubmission, b: TaskSubmission) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      }));

      setAttachments(processedData);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function getLatestSubmission(attachment: TaskAttachment): TaskSubmission | undefined {
    return attachment.submissions?.[attachment.submissions.length - 1];
  }

  function getSubmissionStatus(attachment: TaskAttachment): keyof typeof statusConfig {
    const latest = getLatestSubmission(attachment);
    return (latest?.status as keyof typeof statusConfig) || "pending";
  }

  function handleOpenSubmission(attachment: TaskAttachment) {
    setSelectedAttachment(attachment);
    setDialogType(attachment.attachment_type === "checklist" ? "checklist" : "document");
  }

  function handleCloseDialog() {
    setSelectedAttachment(null);
    setDialogType(null);
  }

  function handleSuccess() {
    handleCloseDialog();
    fetchSubmissions();
  }

  function canEdit(attachment: TaskAttachment): boolean {
    const status = getSubmissionStatus(attachment);
    return status === "pending" || status === "rejected" || status === "flagged";
  }

  // Filter attachments based on selected tab
  const filteredAttachments = useMemo(() => {
    return attachments.filter((attachment) => {
      const status = getSubmissionStatus(attachment);
      
      switch (activeFilter) {
        case "all":
          return true;
        case "action_required":
          return status === "rejected" || status === "flagged";
        case "pending":
          return status === "pending";
        case "submitted":
          return status === "submitted";
        case "approved":
          return status === "approved";
        default:
          return true;
      }
    });
  }, [attachments, activeFilter]);

  // Count items needing action for badge
  const actionRequiredCount = useMemo(() => {
    return attachments.filter((a) => {
      const status = getSubmissionStatus(a);
      return status === "rejected" || status === "flagged";
    }).length;
  }, [attachments]);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <PullToRefreshContainer
      containerRef={containerRef}
      pullDistance={pullDistance}
      progress={progress}
      isRefreshing={isRefreshing}
    >
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Submissions</h1>
        <p className="text-muted-foreground">
          View and manage your checklist and document submissions
        </p>
      </div>

      {/* Filter Tabs - Horizontally scrollable on mobile */}
      <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterStatus)}>
        <TabsList className="w-full h-auto gap-1 bg-muted/50 p-1 overflow-x-auto flex-nowrap justify-start">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const showBadge = tab.value === "action_required" && actionRequiredCount > 0;
            
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-1.5 data-[state=active]:bg-background whitespace-nowrap px-3 shrink-0"
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs sm:text-sm">{tab.label}</span>
                {showBadge && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                    {actionRequiredCount}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Submissions List */}
      <div className="space-y-3">
        {filteredAttachments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {attachments.length === 0
                  ? "No submissions assigned to you yet"
                  : `No ${activeFilter === "all" ? "" : activeFilter.replace("_", " ")} submissions`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAttachments.map((attachment) => {
            const status = getSubmissionStatus(attachment);
            const config = statusConfig[status];
            const StatusIcon = config.icon;
            const latestSubmission = getLatestSubmission(attachment);
            const isEditable = canEdit(attachment);
            const needsAction = status === "rejected" || status === "flagged";

            return (
              <Card
                key={attachment.id}
                className={`transition-shadow ${
                  needsAction ? "border-destructive/50 shadow-md" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                    {/* Top row: Icon + Title + Status + Button */}
                    <div className="flex items-start gap-3 w-full">
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          attachment.attachment_type === "checklist"
                            ? "bg-primary/10 text-primary"
                            : "bg-info/10 text-info"
                        }`}
                      >
                        {attachment.attachment_type === "checklist" ? (
                          <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                        ) : (
                          <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base leading-tight">{attachment.title}</h3>
                            <Badge variant="outline" className={`${config.className} mt-1`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                          </div>
                          
                          {/* Action Button - Desktop inline */}
                          <div className="shrink-0 hidden sm:block">
                            {isEditable ? (
                              <Button
                                variant={needsAction ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleOpenSubmission(attachment)}
                              >
                                {status === "pending" ? (
                                  <>
                                    Submit
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Resubmit
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" disabled>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {status === "submitted" ? "Awaiting Review" : "Completed"}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Task Info */}
                        {attachment.task && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 truncate">
                            {attachment.task.docket_number} - {attachment.task.customer_name}
                          </p>
                        )}

                        {/* Last submission date */}
                        {latestSubmission && status !== "pending" && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted {format(new Date(latestSubmission.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Reviewer Comments for flagged/rejected */}
                    {needsAction && latestSubmission?.reviewer_comments && (
                      <Alert
                        variant="destructive"
                        className="py-2 border sm:ml-14"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <AlertDescription className="text-xs sm:text-sm">
                          <span className="font-medium">Admin Feedback: </span>
                          {latestSubmission.reviewer_comments}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Action Button - Mobile full width */}
                    <div className="sm:hidden">
                      {isEditable ? (
                        <Button
                          variant={needsAction ? "default" : "outline"}
                          size="sm"
                          className="w-full"
                          onClick={() => handleOpenSubmission(attachment)}
                        >
                          {status === "pending" ? (
                            <>
                              Submit
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Resubmit
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="w-full" disabled>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {status === "submitted" ? "Awaiting Review" : "Completed"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Checklist Submission Dialog */}
      {selectedAttachment && dialogType === "checklist" && (
        <ChecklistSubmissionDialog
          open={true}
          onOpenChange={handleCloseDialog}
          attachment={selectedAttachment}
          onSuccess={handleSuccess}
        />
      )}

      {/* Document Upload Dialog */}
      {selectedAttachment && dialogType === "document" && (
        <DocumentUploadDialog
          open={true}
          onOpenChange={handleCloseDialog}
          attachment={selectedAttachment}
          onSuccess={handleSuccess}
        />
      )}
    </div>
    </PullToRefreshContainer>
  );
}
