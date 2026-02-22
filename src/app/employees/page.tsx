"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Users,
  PlusCircle,
  FileText,
  Filter,
  Mail,
} from "lucide-react";
import { useApi } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";
import { mockUsers, mockDepartments, mockPIPs } from "@/lib/mockup-data";
import type { User, PIPRecord, Department, UserRole } from "@/lib/types";

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  super_admin: { label: "Super Admin", className: "bg-brand-700 text-white hover:bg-brand-700" },
  admin: { label: "Admin (HR)", className: "bg-brand-dark text-white hover:bg-brand-dark" },
  manager: { label: "Manager", className: "bg-brand-500 text-white hover:bg-brand-500" },
  employee: { label: "Employee", className: "bg-brown-200 text-brown-800 hover:bg-brown-200" },
};

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Fetch users from API
  const { data: apiUsers, loading, error, refetch } = useApi<User[]>("/api/users");

  // Fallback to mockup
  const users = apiUsers && apiUsers.length > 0 ? apiUsers : mockUsers;
  const departments: Department[] = mockDepartments;

  // Use mockPIPs as fallback for PIP counts (API users might not include this)
  const pips: PIPRecord[] = mockPIPs;

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (
        searchQuery &&
        !user.name.includes(searchQuery) &&
        !user.email.includes(searchQuery) &&
        !user.position.includes(searchQuery)
      )
        return false;
      if (departmentFilter !== "all" && user.department !== departmentFilter)
        return false;
      if (roleFilter !== "all" && user.role !== roleFilter)
        return false;
      return true;
    });
  }, [users, searchQuery, departmentFilter, roleFilter]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return counts;
  }, [users]);

  if (loading) {
    return (
      <AppShell title="รายชื่อพนักงาน" subtitle="จัดการข้อมูลพนักงานทั้งหมด">
        <LoadingSkeleton rows={5} />
      </AppShell>
    );
  }

  if (error && mockUsers.length === 0) {
    return (
      <AppShell title="รายชื่อพนักงาน" subtitle="จัดการข้อมูลพนักงานทั้งหมด">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }

  return (
    <AppShell title="รายชื่อพนักงาน" subtitle="จัดการข้อมูลพนักงานทั้งหมด">
      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-brand-100 p-2.5">
              <Users className="h-5 w-5 text-brand-dark" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">พนักงานทั้งหมด</p>
              <p className="text-2xl font-bold font-title">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        {(["employee", "manager", "admin"] as UserRole[]).map((role) => (
          <Card key={role} className="border-none shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <Badge className={`${roleConfig[role].className} px-2 py-1`}>
                {roleConfig[role].label}
              </Badge>
              <p className="text-2xl font-bold font-title">{roleCounts[role] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-4 border-none shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อ, อีเมล, ตำแหน่ง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="แผนก" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกแผนก</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.name}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุก Role</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin (HR)</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-title">
            ผลการค้นหา ({filteredUsers.length} คน)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>พนักงาน</TableHead>
                <TableHead>ตำแหน่ง</TableHead>
                <TableHead>แผนก</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead className="text-center">PIP</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    ไม่พบพนักงานที่ตรงกับเงื่อนไข
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const initials = user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("");
                  const userPIPs = pips.filter(
                    (p) => p.employeeId === user.id
                  );
                  const activePIPs = userPIPs.filter(
                    (p) => p.status === "active"
                  );
                  const manager = users.find(
                    (u) => u.id === user.managerId
                  );

                  return (
                    <TableRow key={user.id} className="hover:bg-brand-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-brand-100 text-brand-dark font-body text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            {manager && (
                              <p className="text-[10px] text-muted-foreground">
                                หัวหน้า: {manager.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{user.position}</TableCell>
                      <TableCell className="text-sm">{user.department}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${roleConfig[user.role].className}`}>
                          {roleConfig[user.role].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {userPIPs.length > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <Badge variant="outline" className="text-[10px]">
                              {userPIPs.length} รายการ
                            </Badge>
                            {activePIPs.length > 0 && (
                              <Badge className="bg-accent-brand-500 text-white hover:bg-accent-brand-500 text-[10px]">
                                {activePIPs.length} active
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {userPIPs.length > 0 && (
                            <Link href={`/pip?employee=${user.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-brand-dark hover:bg-brand-50"
                                title="ดู PIP"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {user.role === "employee" && (
                            <Link href="/pip/create">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-brand-dark hover:bg-brand-50"
                                title="สร้าง PIP"
                              >
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
