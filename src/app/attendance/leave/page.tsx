"use client";

import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle, CalendarOff, CheckCircle2, XCircle, Hourglass } from "lucide-react";
import Link from "next/link";
import { useApi } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";

// ---------- Types ----------
interface LeaveRequest {
  id: number;
  name: string;
  department: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
}

// ---------- Mock Data (fallback for dev without DB) ----------
const leaveStatusConfig: Record<string, { label: string; className: string }> = {
  approved: {
    label: "อนุมัติ",
    className: "bg-brand-dark text-white hover:bg-brand-dark",
  },
  pending: {
    label: "รออนุมัติ",
    className: "bg-brown-200 text-brown-800 hover:bg-brown-200",
  },
  rejected: {
    label: "ไม่อนุมัติ",
    className: "bg-accent-brand-500 text-white hover:bg-accent-brand-500",
  },
};

const leaveTypeConfig: Record<string, { label: string; className: string }> = {
  sick: { label: "ลาป่วย", className: "bg-red-100 text-red-700 hover:bg-red-100" },
  personal: { label: "ลากิจ", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  annual: { label: "ลาพักร้อน", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  maternity: { label: "ลาคลอด", className: "bg-pink-100 text-pink-700 hover:bg-pink-100" },
  ordination: { label: "ลาบวช", className: "bg-purple-100 text-purple-700 hover:bg-purple-100" },
};

const mockLeaveRequests: LeaveRequest[] = [
  { id: 1, name: "พิมพ์ใจ แสนสุข", department: "การเงิน", type: "sick", startDate: "2026-02-20", endDate: "2026-02-20", days: 1, reason: "ไม่สบาย มีไข้", status: "approved" },
  { id: 2, name: "วิชัย สุขสบาย", department: "บุคคล", type: "personal", startDate: "2026-02-20", endDate: "2026-02-21", days: 2, reason: "ธุระส่วนตัว", status: "pending" },
  { id: 3, name: "สมชาย ใจดี", department: "วิศวกรรม", type: "annual", startDate: "2026-02-24", endDate: "2026-02-28", days: 5, reason: "ไปพักผ่อนกับครอบครัว", status: "pending" },
  { id: 4, name: "นภา สดใส", department: "วิศวกรรม", type: "sick", startDate: "2026-02-12", endDate: "2026-02-12", days: 1, reason: "ปวดท้อง", status: "approved" },
  { id: 5, name: "กัลยา อยู่ดี", department: "ปฏิบัติการ", type: "personal", startDate: "2026-02-10", endDate: "2026-02-10", days: 1, reason: "พาลูกไปหาหมอ", status: "approved" },
  { id: 6, name: "ธนกร มั่นคง", department: "การตลาด", type: "annual", startDate: "2026-03-01", endDate: "2026-03-05", days: 5, reason: "ท่องเที่ยวต่างประเทศ", status: "pending" },
  { id: 7, name: "รัตนา ศรีสุข", department: "บุคคล", type: "sick", startDate: "2026-02-05", endDate: "2026-02-06", days: 2, reason: "เป็นไข้หวัด", status: "approved" },
  { id: 8, name: "มานะ พากเพียร", department: "ปฏิบัติการ", type: "annual", startDate: "2026-02-25", endDate: "2026-02-25", days: 1, reason: "ติดต่อราชการ", status: "rejected" },
];

// ---------- Components ----------
function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-bold font-title">{value}</p>
          </div>
          <div className={`rounded-lg p-2.5 ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Page ----------
export default function LeaveRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [typeFilter, setTypeFilter] = useState("ทั้งหมด");

  const { data: apiLeaveRequests, loading, error, refetch } = useApi<LeaveRequest[]>(
    "/api/attendance/leave"
  );

  // Use API data or fallback to mock data for dev without DB
  const leaveRequests = apiLeaveRequests ?? mockLeaveRequests;

  const filtered = useMemo(() => {
    return leaveRequests.filter((r) => {
      const matchStatus = statusFilter === "ทั้งหมด" || r.status === statusFilter;
      const matchType = typeFilter === "ทั้งหมด" || r.type === typeFilter;
      return matchStatus && matchType;
    });
  }, [leaveRequests, statusFilter, typeFilter]);

  const totalPending = leaveRequests.filter((r) => r.status === "pending").length;
  const totalApproved = leaveRequests.filter((r) => r.status === "approved").length;
  const totalRejected = leaveRequests.filter((r) => r.status === "rejected").length;
  const totalDays = leaveRequests
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + r.days, 0);

  if (loading) {
    return (
      <AppShell title="คำขอลางาน" subtitle="จัดการคำขอลาของพนักงาน">
        <LoadingSkeleton />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="คำขอลางาน" subtitle="จัดการคำขอลาของพนักงาน">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }

  return (
    <AppShell title="คำขอลางาน" subtitle="จัดการคำขอลาของพนักงาน">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="รออนุมัติ" value={totalPending} icon={Hourglass} color="bg-brown-500" />
        <StatCard title="อนุมัติแล้ว" value={totalApproved} icon={CheckCircle2} color="bg-brand-dark" />
        <StatCard title="ไม่อนุมัติ" value={totalRejected} icon={XCircle} color="bg-accent-brand-500" />
        <StatCard title="วันลารวม (อนุมัติ)" value={totalDays} icon={CalendarOff} color="bg-brand-700" />
      </div>

      {/* Filter & Table */}
      <Card className="mt-6 border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-title">รายการคำขอลา</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ทั้งหมด">สถานะทั้งหมด</SelectItem>
                  <SelectItem value="pending">รออนุมัติ</SelectItem>
                  <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                  <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ทั้งหมด">ประเภททั้งหมด</SelectItem>
                  {Object.entries(leaveTypeConfig).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Link href="/attendance/leave/create">
                <Button className="h-9 gap-2 bg-brand-dark text-white hover:bg-brand-700">
                  <PlusCircle className="h-4 w-4" />
                  ยื่นคำขอลา
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>พนักงาน</TableHead>
                <TableHead>ประเภทการลา</TableHead>
                <TableHead>วันที่เริ่ม</TableHead>
                <TableHead>วันที่สิ้นสุด</TableHead>
                <TableHead className="text-right">จำนวนวัน</TableHead>
                <TableHead>เหตุผล</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{req.name}</p>
                      <p className="text-xs text-muted-foreground">{req.department}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={leaveTypeConfig[req.type].className}>
                      {leaveTypeConfig[req.type].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{req.startDate}</TableCell>
                  <TableCell className="text-sm">{req.endDate}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{req.days}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{req.reason}</TableCell>
                  <TableCell>
                    <Badge className={leaveStatusConfig[req.status].className}>
                      {leaveStatusConfig[req.status].label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              ไม่มีคำขอลาที่ตรงกับตัวกรอง
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
