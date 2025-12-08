import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  FileText,
  Truck,
  ChevronRight,
  Clock,
  CheckCircle2,
} from "lucide-react";

// Demo data - simplified for driver view
const myTasks: Array<{
  id: string;
  customer: string;
  product: string;
  deliveryDate: string;
  status: "new" | "in_progress" | "completed";
  cleanlinessDone: boolean;
  fitnessDone: boolean;
}> = [
  {
    id: "TASK-155",
    customer: "ARDEX AUSTRALIA",
    product: "Industrial Resin",
    deliveryDate: "24 Nov 2025",
    status: "in_progress",
    cleanlinessDone: true,
    fitnessDone: false,
  },
  {
    id: "TASK-157",
    customer: "XYZ Industries",
    product: "High Alumina Cement",
    deliveryDate: "25 Nov 2025",
    status: "new",
    cleanlinessDone: false,
    fitnessDone: false,
  },
];

export function DriverDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Welcome Section - Large and friendly */}
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <h1 className="text-2xl font-bold text-foreground">
          Hello, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          You have {myTasks.filter((t) => t.status !== "completed").length} active tasks
        </p>
      </div>

      {/* Quick Actions - Large touch targets */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/checklists/cleanliness">
          <Card className="h-full hover:shadow-elevated transition-shadow cursor-pointer border-2 border-transparent hover:border-accent">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-3">
                <ClipboardCheck className="h-7 w-7 text-success" />
              </div>
              <span className="font-semibold">Certificate of Cleanliness</span>
              <span className="text-xs text-muted-foreground mt-1">
                Submit new
              </span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/checklists/fitness">
          <Card className="h-full hover:shadow-elevated transition-shadow cursor-pointer border-2 border-transparent hover:border-accent">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-info/10 flex items-center justify-center mb-3">
                <FileText className="h-7 w-7 text-info" />
              </div>
              <span className="font-semibold">Fitness Declaration</span>
              <span className="text-xs text-muted-foreground mt-1">
                Submit new
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* My Tasks - Simple list */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">My Tasks</CardTitle>
          <Link to="/tasks">
            <Button variant="ghost" size="sm" className="text-accent">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {myTasks.map((task) => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="block p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-accent">
                        {task.id}
                      </span>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="font-medium truncate">{task.customer}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {task.product}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {task.deliveryDate}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      {task.cleanlinessDone ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      <span className="text-xs">Clean</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {task.fitnessDone ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      <span className="text-xs">Fitness</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View Submissions */}
      <Link to="/submissions">
        <Card className="hover:shadow-elevated transition-shadow cursor-pointer">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">My Submissions</p>
                <p className="text-sm text-muted-foreground">
                  View your checklist history
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
