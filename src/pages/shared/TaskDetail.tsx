import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Calendar, 
  Truck, 
  User, 
  Building2,
  Loader2,
  FileText,
  ClipboardList,
  FileUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { AddDocumentDialog } from "@/components/tasks/AddDocumentDialog";
import { AddChecklistDialog } from "@/components/tasks/AddChecklistDialog";
import { AttachmentsList } from "@/components/tasks/AttachmentsList";
import { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type TaskAttachment = Tables<"task_attachments"> & {
  checklist_templates?: { title: string; description: string | null } | null;
  submissions?: TaskSubmission[];
};
type TaskSubmission = Tables<"task_submissions">;

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);

  const isAdmin = user?.role === "admin";
  const canReview = ["admin", "warehouse", "operational_lead"].includes(user?.role || "");

  useEffect(() => {
    if (id) {
      fetchTaskAndAttachments();
    }
  }, [id]);

  async function fetchTaskAndAttachments() {
    try {
      setIsLoading(true);
      
      // Fetch task
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (taskError) throw taskError;
      if (!taskData) {
        toast.error("Task not found");
        return;
      }
      setTask(taskData);

      // Fetch attachments with templates and submissions
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from("task_attachments")
        .select(`
          *,
          checklist_templates (title, description),
          submissions:task_submissions (*)
        `)
        .eq("task_id", id)
        .order("created_at", { ascending: true });

      if (attachmentsError) throw attachmentsError;
      setAttachments(attachmentsData || []);

    } catch (error) {
      console.error("Error fetching task:", error);
      toast.error("Failed to load task details");
    } finally {
      setIsLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy");
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-4 lg:p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Task not found</p>
            <Link to="/tasks">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tasks
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">
              Docket #{task.docket_number}
            </h1>
            <StatusBadge status={task.status} />
          </div>
          <p className="text-muted-foreground">{task.customer_name}</p>
        </div>
      </div>

      {/* Task Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Task Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Product</p>
                <p className="font-medium">{task.product_name || "N/A"}</p>
                <p className="text-sm text-muted-foreground">
                  {task.number_of_bags || 0} bags × {task.bag_weight}kg
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Supplier</p>
                <p className="font-medium">{task.supplier}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Delivery Address</p>
                <p className="font-medium">{task.delivery_address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Assigned Driver</p>
                <p className="font-medium">{task.assigned_driver_name || "Unassigned"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Planned Dates</p>
                <p className="font-medium">
                  Decant: {formatDate(task.planned_decant_date)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Delivery: {formatDate(task.planned_delivery_date)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="font-medium capitalize">{task.vehicle_type}</p>
                <p className="text-sm text-muted-foreground">{task.haulier_tanker}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attachments & Submissions Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Submissions
          </CardTitle>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setShowDocumentDialog(true)} 
                size="sm"
                variant="outline"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Add Document
              </Button>
              <Button 
                onClick={() => setShowChecklistDialog(true)} 
                size="sm"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Add Checklist
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No submission requirements added yet</p>
              {isAdmin && (
                <p className="text-sm mt-1">
                  Add document uploads or checklist requirements for this task
                </p>
              )}
            </div>
          ) : (
            <AttachmentsList 
              attachments={attachments} 
              canReview={canReview}
              onRefresh={fetchTaskAndAttachments}
              taskTitle={task?.docket_number ? `${task.docket_number} - ${task.customer_name}` : undefined}
              taskId={task.id}
            />
          )}
        </CardContent>
      </Card>

      {/* Document Dialog */}
      <AddDocumentDialog
        open={showDocumentDialog}
        onOpenChange={setShowDocumentDialog}
        taskId={task.id}
        onSuccess={fetchTaskAndAttachments}
      />

      {/* Checklist Dialog */}
      <AddChecklistDialog
        open={showChecklistDialog}
        onOpenChange={setShowChecklistDialog}
        taskId={task.id}
        onSuccess={fetchTaskAndAttachments}
      />
    </div>
  );
}
