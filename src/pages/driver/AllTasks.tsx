import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Clock, MapPin, Package, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { TaskStatus } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast, startOfDay } from "date-fns";

interface Task {
  id: string;
  docket_number: string;
  customer_name: string;
  delivery_address: string;
  product_name: string | null;
  number_of_bags: number | null;
  bag_weight: number;
  planned_delivery_date: string;
  assigned_driver_name: string | null;
  assigned_driver_id: string | null;
  status: TaskStatus;
}

export default function AllTasks() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, docket_number, customer_name, delivery_address, product_name, number_of_bags, bag_weight, planned_delivery_date, assigned_driver_name, assigned_driver_id, status')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setTasks(data || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.docket_number.toLowerCase().includes(search.toLowerCase()) ||
      task.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (task.product_name?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate task counts by status
  const taskCounts = useMemo(() => {
    const searchFiltered = tasks.filter((task) => {
      return (
        task.docket_number.toLowerCase().includes(search.toLowerCase()) ||
        task.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        (task.product_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
      );
    });

    return {
      all: searchFiltered.length,
      new: searchFiltered.filter((t) => t.status === "new").length,
      in_progress: searchFiltered.filter((t) => t.status === "in_progress").length,
      completed: searchFiltered.filter((t) => t.status === "completed").length,
    };
  }, [tasks, search]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return dateString;
    }
  };

  const isOverdue = (dateString: string, status: TaskStatus) => {
    if (status === "completed" || status === "cancelled") return false;
    try {
      const deliveryDate = startOfDay(new Date(dateString));
      const today = startOfDay(new Date());
      return isPast(deliveryDate) && deliveryDate < today;
    } catch {
      return false;
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/tasks">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">All My Tasks</h1>
          <p className="text-muted-foreground">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by docket, customer, or product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11"
        />
      </div>

      {/* Status Tabs - Full options */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="w-full grid grid-cols-4 h-auto">
          <TabsTrigger value="all" className="py-2.5 text-xs sm:text-sm gap-1">
            All
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
              {taskCounts.all}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="new" className="py-2.5 text-xs sm:text-sm gap-1">
            To Do
            <Badge 
              variant={taskCounts.new > 0 ? "destructive" : "secondary"}
              className="h-5 min-w-5 px-1.5 text-xs"
            >
              {taskCounts.new}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="py-2.5 text-xs sm:text-sm gap-1">
            <span className="hidden sm:inline">In Progress</span>
            <span className="sm:hidden">Active</span>
            <Badge 
              variant={taskCounts.in_progress > 0 ? "default" : "secondary"}
              className="h-5 min-w-5 px-1.5 text-xs"
            >
              {taskCounts.in_progress}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="py-2.5 text-xs sm:text-sm gap-1">
            <span className="hidden sm:inline">Completed</span>
            <span className="sm:hidden">Done</span>
            <Badge 
              className="h-5 min-w-5 px-1.5 text-xs bg-success/20 text-success hover:bg-success/30"
            >
              {taskCounts.completed}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Task List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Loading tasks...</p>
            </CardContent>
          </Card>
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No tasks found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => {
            const taskOverdue = isOverdue(task.planned_delivery_date, task.status);
            return (
              <Link key={task.id} to={`/tasks/${task.id}`}>
                <Card className={`hover:shadow-elevated transition-shadow cursor-pointer ${taskOverdue ? 'border-destructive/50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-mono text-sm font-semibold text-accent">
                            Docket #{task.docket_number}
                          </span>
                          <StatusBadge status={task.status} />
                          {taskOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <p className="font-semibold text-lg truncate">
                          {task.customer_name}
                        </p>
                        <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {task.product_name || 'No product'} • {task.number_of_bags || 0} bags ×{" "}
                              {task.bag_weight}kg
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{task.delivery_address}</span>
                          </div>
                          <div className={`flex items-center gap-2 ${taskOverdue ? 'text-destructive font-medium' : ''}`}>
                            <Clock className={`h-4 w-4 flex-shrink-0 ${taskOverdue ? 'text-destructive' : ''}`} />
                            <span>Delivery: {formatDate(task.planned_delivery_date)}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
