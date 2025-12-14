import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import {
  AdminLayout,
  DriverLayout,
  WarehouseLayout,
  ExecutiveLayout,
} from "@/layouts";
import { RoleGuard } from "@/components/guards/RoleGuard";

// Pages - Auth
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Pages - Shared
import Dashboard from "./pages/shared/Dashboard";
import Tasks from "./pages/shared/Tasks";
import TaskDetail from "./pages/shared/TaskDetail";
import Documents from "./pages/shared/Documents";

// Pages - Admin
import CreateTask from "./pages/admin/CreateTask";
import ChecklistBuilder from "./pages/admin/ChecklistBuilder";
import Submissions from "./pages/admin/Submissions";
import Users from "./pages/admin/Users";
import Settings from "./pages/admin/Settings";

// Pages - Driver/Warehouse
import AllTasks from "./pages/driver/AllTasks";
import Checklists from "./pages/driver/Checklists";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Role-based layout selector
function RoleBasedLayout() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;

  switch (user.role) {
    case "admin":
      return <AdminLayout />;
    case "driver":
      return <DriverLayout />;
    case "warehouse":
      return <WarehouseLayout />;
    case "executive":
    case "operational_lead":
      return <ExecutiveLayout />;
    default:
      return <AdminLayout />;
  }
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      {/* Protected Routes with Role-Based Layout */}
      <Route
        element={
          <ProtectedRoute>
            <RoleBasedLayout />
          </ProtectedRoute>
        }
      >
        {/* Shared Routes - accessible by all roles */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/:id" element={<TaskDetail />} />
        <Route path="/documents" element={<Documents />} />

        {/* Admin Only Routes */}
        <Route
          path="/tasks/create"
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <CreateTask />
            </RoleGuard>
          }
        />
        <Route
          path="/tasks/:taskId/checklist-builder"
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <ChecklistBuilder />
            </RoleGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <Settings />
            </RoleGuard>
          }
        />

        {/* Admin & Ops Lead Routes */}
        <Route
          path="/users"
          element={
            <RoleGuard allowedRoles={["admin", "operational_lead"]}>
              <Users />
            </RoleGuard>
          }
        />

        {/* Admin, Executive, Ops Lead, Warehouse Routes */}
        <Route
          path="/submissions"
          element={
            <RoleGuard allowedRoles={["admin", "executive", "operational_lead", "warehouse"]}>
              <Submissions />
            </RoleGuard>
          }
        />

        {/* Driver & Warehouse Routes */}
        <Route path="/tasks/all" element={<AllTasks />} />
        <Route
          path="/checklists"
          element={
            <RoleGuard allowedRoles={["driver", "warehouse"]}>
              <Checklists />
            </RoleGuard>
          }
        />
        <Route
          path="/checklists/:type"
          element={
            <RoleGuard allowedRoles={["driver", "warehouse"]}>
              <Checklists />
            </RoleGuard>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
