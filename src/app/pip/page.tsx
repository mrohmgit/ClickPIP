"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusCircle,
  Search,
  Eye,
  Calendar,
  Filter,
  Download,
} from "lucide-react";
import { useApi } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";
import { mockPIPs, mockDepartments } from "@/lib/mockup-data";
import type { PIPRecord, Department } from "@/lib/types";

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  active: {
    label: "กำลังดำเนินการ",
    className: "bg-brand-dark text-white hover:bg-brand-dark",
  },
  completed: {
    label: "สำเร็จ",
    className: "bg-brand-500 text-white hover:bg-brand-500",
  },
  failed: {
    label: "ไม่ผ่าน",
    className: "bg-accent-brand-500 text-white hover:bg-accent-brand-500",
  },
  pending: {
    label: "รอดำเนินการ",
    className: "bg-brown-200 text-brown-800 hover:bg-brown-200",
  },
  extended: {
    label: "ขยายเวลา",
    className: "border-brand-dark text-brand-dark",
  },
};

const resultConfig: Record<string, { label: string; className: string }> = {
  passed: {
    label: "ผ่าน",
    className: "bg-brand-100 text-brand-dark hover:bg-brand-100",
  },
  failed: {
    label: "ไม่ผ่าน",
    className: "bg-accent-brand-100 text-accent-brand-700 hover:bg-accent-brand-100",
  },
};

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date("2026-02-20");
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-brand-100">
        <div
          className="h-2 rounded-full bg-brand-dark transition-all"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground">
        {value}%
      </span>
    </div>
  );
}

export default function PIPListPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [durationFilter, setDurationFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: apiPIPs, loading, error, refetch } = useApi<PIPRecord[]>("/api/pip");

  // Fallback to mockup data
  const pips = apiPIPs && apiPIPs.length > 0 ? apiPIPs : mockPIPs;

  // Departments fallback
  const departments: Department[] = mockDepartments;

  const filteredPIPs = useMemo(() => {
    return pips.filter((pip) => {
      if (statusFilter !== "all" && pip.status !== statusFilter) return false;
      if (
        departmentFilter !== "all" &&
        pip.employeeDepartment !== departmentFilter
      )
        return false;
      if (
        durationFilter !== "all" &&
        pip.duration !== Number(durationFilter)
      )
        return false;
      if (
        searchQuery &&
        !pip.employeeName.includes(searchQuery) &&
        !pip.managerName.includes(searchQuery) &&
        !pip.reason.includes(searchQuery)
      )
        return false;
      return true;
    });
  }, [pips, statusFilter, departmentFilter, durationFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: pips.length };
    pips.forEach((pip) => {
      counts[pip.status] = (counts[pip.status] || 0) + 1;
    });
    return counts;
  }, [pips]);

  if (loading) {
    return (
      <AppShell title="รายการ PIP" subtitle="จัดการแผนพัฒนาประสิทธิภาพทั้งหมด">
        <LoadingSkeleton rows={5} />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="รายการ PIP" subtitle="จัดการแผนพัฒนาประสิทธิภาพทั้งหมด">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }

  return (
    <AppShell title="รายการ PIP" subtitle="จัดการแผนพัฒนาประสิทธิภาพทั้งหมด">
      {/* Status Tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={setStatusFilter}
        className="mb-4"
      >
        <TabsList className="bg-white">
          <TabsTrigger value="all" className="data-[state=active]:bg-brand-dark data-[state=active]:text-white">
            ทั้งหมด ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-brand-dark data-[state=active]:text-white">
            กำลังดำเนินการ ({statusCounts.active || 0})
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-brand-dark data-[state=active]:text-white">
            รอดำเนินการ ({statusCounts.pending || 0})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-brand-dark data-[state=active]:text-white">
            สำเร็จ ({statusCounts.completed || 0})
          </TabsTrigger>
          <TabsTrigger value="failed" className="data-[state=active]:bg-brand-dark data-[state=active]:text-white">
            ไม่ผ่าน ({statusCounts.failed || 0})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters & Actions */}
      <Card className="mb-4 border-none shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อพนักงาน, หัวหน้า, เหตุผล..."
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
          <Select value={durationFilter} onValueChange={setDurationFilter}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="ระยะเวลา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกระยะเวลา</SelectItem>
              <SelectItem value="30">30 วัน</SelectItem>
              <SelectItem value="60">60 วัน</SelectItem>
              <SelectItem value="90">90 วัน</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/pip/create">
            <Button size="sm" className="bg-brand-dark hover:bg-brand-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              สร้าง PIP ใหม่
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* PIP Table */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-title">
            ผลการค้นหา ({filteredPIPs.length} รายการ)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>พนักงาน</TableHead>
                <TableHead>แผนก</TableHead>
                <TableHead>หัวหน้า</TableHead>
                <TableHead>ระยะเวลา</TableHead>
                <TableHead>วันที่เริ่ม</TableHead>
                <TableHead>วันสิ้นสุด</TableHead>
                <TableHead>ความคืบหน้า</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ผลลัพธ์</TableHead>
                <TableHead className="w-[80px]">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPIPs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="py-12 text-center text-muted-foreground"
                  >
                    ไม่พบรายการ PIP ที่ตรงกับเงื่อนไข
                  </TableCell>
                </TableRow>
              ) : (
                filteredPIPs.map((pip, index) => {
                  const daysLeft = getDaysRemaining(pip.endDate);
                  const totalGoals = (pip.goals || []).length;
                  const avgProgress =
                    totalGoals > 0
                      ? Math.round(
                          (pip.goals || []).reduce(
                            (sum, g) =>
                              sum +
                              Math.min(
                                (g.currentValue / g.targetValue) * 100,
                                100
                              ),
                            0
                          ) / totalGoals
                        )
                      : 0;

                  return (
                    <TableRow key={pip.id} className="hover:bg-brand-50/50">
                      <TableCell className="text-sm text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{pip.employeeName}</p>
                          <p className="text-xs text-muted-foreground">
                            {pip.employeePosition}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {pip.employeeDepartment}
                      </TableCell>
                      <TableCell className="text-sm">
                        {pip.managerName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {pip.duration} วัน
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{pip.startDate}</TableCell>
                      <TableCell>
                        <div className="text-sm">{pip.endDate}</div>
                        {pip.status === "active" && (
                          <span
                            className={`text-[10px] ${
                              daysLeft <= 14
                                ? "text-accent-brand-500 font-medium"
                                : "text-muted-foreground"
                            }`}
                          >
                            (เหลือ {daysLeft} วัน)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {totalGoals > 0 ? (
                          <ProgressBar value={avgProgress} />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            ยังไม่กำหนดเป้า
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusConfig[pip.status]?.className}
                        >
                          {statusConfig[pip.status]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {pip.result ? (
                          <Badge className={resultConfig[pip.result]?.className}>
                            {resultConfig[pip.result]?.label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/pip/${pip.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-brand-dark hover:bg-brand-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
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
