import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreVertical, Edit, Ban, Trash2, Loader2, RefreshCw } from "lucide-react";
import { UserRole } from "@/types";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  driver: "Driver",
  warehouse: "Warehouse",
  executive: "Executive",
  operational_lead: "Ops Lead",
};

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  department: string;
  avatarUrl: string;
  role: UserRole;
  status: "active" | "pending";
  createdAt: string;
  lastSignIn: string | null;
}

export default function Users() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        toast.error("You must be logged in to view users");
        return;
      }

      const { data, error } = await supabase.functions.invoke('list-users');

      if (error) {
        console.error('Error fetching users:', error);
        toast.error(error.message || "Failed to load users");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setUsers(data.users || []);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "all" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">
            {isLoading ? "Loading..." : `${filteredUsers.length} user${filteredUsers.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchUsers} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {isAdmin && (
            <Button onClick={() => setAddUserOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          )}
        </div>
      </div>

      <AddUserDialog 
        open={addUserOpen} 
        onOpenChange={setAddUserOpen}
        onSuccess={fetchUsers}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-11">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.entries(roleLabels).map(([role, label]) => (
              <SelectItem key={role} value={role}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {users.length === 0 
              ? "No users found. Add your first user to get started."
              : "No users match your search criteria."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {u.firstName?.[0] || u.email[0].toUpperCase()}
                      {u.lastName?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {u.firstName || u.lastName 
                          ? `${u.firstName} ${u.lastName}`.trim()
                          : u.email}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          u.status === "active"
                            ? "bg-success/10 text-success"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {u.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {u.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-secondary rounded-md">
                        {roleLabels[u.role] || u.role}
                      </span>
                      {u.phone && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {u.phone}
                        </span>
                      )}
                      {u.department && (
                        <span className="text-xs text-muted-foreground hidden md:inline">
                          • {u.department}
                        </span>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Ban className="h-4 w-4 mr-2" />
                          Deactivate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
