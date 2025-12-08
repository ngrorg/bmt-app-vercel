import { useState } from "react";
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
import { Search, Plus, MoreVertical, Edit, Ban, Trash2 } from "lucide-react";
import { UserRole } from "@/types";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { useAuth } from "@/context/AuthContext";

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  driver: "Driver",
  warehouse: "Warehouse",
  executive: "Executive",
  operational_lead: "Ops Lead",
};

// Demo data
const users = [
  {
    id: "1",
    firstName: "John",
    lastName: "Smith",
    email: "john.driver@bmt.com.au",
    phone: "+61 4 1234 5678",
    role: "driver" as UserRole,
    status: "active" as const,
  },
  {
    id: "2",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.driver@bmt.com.au",
    phone: "+61 4 2345 6789",
    role: "driver" as UserRole,
    status: "active" as const,
  },
  {
    id: "3",
    firstName: "Mike",
    lastName: "Brown",
    email: "mike.warehouse@bmt.com.au",
    phone: "+61 4 3456 7890",
    role: "warehouse" as UserRole,
    status: "active" as const,
  },
  {
    id: "4",
    firstName: "Emma",
    lastName: "Davis",
    email: "emma.exec@bmt.com.au",
    phone: "+61 2 9999 0002",
    role: "executive" as UserRole,
    status: "active" as const,
  },
  {
    id: "5",
    firstName: "David",
    lastName: "Wilson",
    email: "david.ops@bmt.com.au",
    phone: "+61 2 9999 0003",
    role: "operational_lead" as UserRole,
    status: "pending" as const,
  },
];

export default function Users() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [addUserOpen, setAddUserOpen] = useState(false);
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setAddUserOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        )}
      </div>

      <AddUserDialog 
        open={addUserOpen} 
        onOpenChange={setAddUserOpen}
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
      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      {user.firstName} {user.lastName}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        user.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-secondary rounded-md">
                      {roleLabels[user.role]}
                    </span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {user.phone}
                    </span>
                  </div>
                </div>
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
