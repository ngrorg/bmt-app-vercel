// User roles in the system
export type UserRole = 'admin' | 'driver' | 'warehouse' | 'executive' | 'operational_lead';
import { Tables, Json } from "@/integrations/supabase/types";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
  status: 'active' | 'inactive' | 'pending';
}

// Task/Delivery related types
export type TaskStatus = 'new' | 'in_progress' | 'completed' | 'cancelled';
export type ChecklistStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'flagged';

export interface Task {
  id: string;
  customerName: string;
  deliveryAddress: string;
  productName: string;
  supplier: string;
  numberOfBags: number;
  bagWeight: number;
  docketNumber: string;
  plannedDecantDate: string;
  plannedDeliveryDate: string;
  vehicleType: 'truck' | 'tank';
  haulierTanker: string;
  assignedDriverId: string;
  assignedDriverName: string;
  status: TaskStatus;
  createdAt: string;
  createdBy: string;
}

export interface ChecklistSubmission {
  id: string;
  taskId: string;
  type: 'cleanliness' | 'decant' | 'fitness';
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  status: ChecklistStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerComments?: string;
  data: Record<string, unknown>;
}

// Dashboard stats
export interface DashboardStats {
  totalTasks: number;
  newTasks: number;
  inProgress: number;
  completed: number;
  totalSubmissions: number;
  pendingReviews: number;
}

// Navigation
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

export type SubmissionStatus = "pending" | "submitted" | "approved" | "rejected" | "flagged";

export interface SubmissionWithDetails {
  id: string;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
  submitted_by: string | null;
  submitted_by_name: string | null;
  form_data: Json | null;
  file_path: string | null;
  file_name: string | null;
  reviewer_comments: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  task_attachment_id: string;
  task_attachment: {
    id: string;
    title: string;
    attachment_type: string;
    assigned_to: string;
    task: {
      id: string;
      docket_number: string;
      customer_name: string;
      delivery_address: string;
    } | null;
  } | null;
}