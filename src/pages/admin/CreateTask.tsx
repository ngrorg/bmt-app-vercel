import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm';

export default function CreateTask() {
  const { user } = useAuth();

  // Only admin can access this page
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create New Delivery Task</h1>
        <p className="text-muted-foreground">Checklist for Bulk Bag Decant to Tankers</p>
      </div>
      
      <CreateTaskForm />
    </div>
  );
}
