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
import { Clock, CheckCircle2, XCircle, Hourglass } from "lucide-react";
import { useApi, useApiMutation } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";

// ---------- Types ----------
interface OtRequest {
  id: number;
  name: string;
  department: string;
  date: string;
  hours: number;
  reason: string;
  status: string;
}

// ---------- Mock Data (fallback for dev without DB) ----------
const otStatusConfig: Record<string, { label: string; className: string }> = {
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

const mockOtRequests: OtRequest[] = [
  { id: 1, name: "อนันต์ ทำดี", department: "วิศวกรรม", date: "2026-02-20", hours: 2, reason: "แก้บั๊กระบบ production เร่งด่วน", status: "pending" },
  { id: 2, name: "สุดา ใจงาม", department: "วิศวกรรม", date: "2026-02-20", hours: 3, reason: "เตรียม deployment version ใหม่", status: "pending" },
  { id: 3, name: "สมหญิง รักงาน", department: "การตลาด", date: "2026-02-19", hours: 1.5, reason: "จัดทำเอกสาร campaign Q1", status: "approved" },
  { id: 4, name: "ประภาส รุ่งเรือง", department: "การเงิน", date: "2026-02-18", hours: 1.5, reason: "ปิดงบเดือนมกราคม", status: "approved" },
  { id: 5, name: "อนันต์ ทำดี", department: "วิศวกรรม", date: "2026-02-17", hours: 2, reason: "เขียน unit tests", status: "approved" },
  { id: 6, name: "กัลยา อยู่ดี", department: "ปฏิบัติการ", date: "2026-02-16", hours: 1, reason: "ตรวจสอบสต๊อกสินค้า", status: "rejected" },
  { id: 7, name: "ธนกร มั่นคง", department: "การตลาด", date: "2026-02-15", hours: 2.5, reason: "ถ่ายทำวิดีโอสินค้าใหม่", status: "approved" },
  { id: 8, name: "นภา สดใส", department: "วิศวกรรม", date: "2026-02-14", hours: 3, reason: "Migration ฐานข้อมูล", status: "pending" },
];

// ---------- Components ----------
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-bold font-title">{value}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
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
export default function OvertimePage() {
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");

  const { data: apiRequests, loading, error, refetch } = useApi<OtRequest[]>(
    "/api/attendance/overtime"
  );

  // Use API data or fallback to mock data for dev without DB
  const [localOverrides, setLocalOverrides] = useState<Record<number, string>>({});
  const requests = useMemo(() => {
    const base = apiRequests ?? mockOtRequests;
    return base.map((r) => ({
      ...r,
      status: localOverrides[r.id] ?? r.status,
    }));
  }, [apiRequests, localOverrides]);

  const filtered = statusFilter === "ทั้งหมด"
    ? requests
    : requests.filter((r) => r.status === statusFilter);

  const totalPending = requests.filter((r) => r.status === "pending").length;
  const totalApproved = requests.filter((r) => r.status === "approved").length;
  const totalRejected = requests.filter((r) => r.status === "rejected").length;
  const totalHours = requests
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + r.hours, 0);

  const { mutate: mutateApprove, loading: savingApprove } = useApiMutation("/api/attendance/overtime");
  const { mutate: mutateReject, loading: savingReject } = useApiMutation("/api/attendance/overtime");

  const handleApprove = async (id: number) => {
    // Optimistic update
    setLocalOverrides((prev) => ({ ...prev, [id]: "approved" }));
    const result = await mutateApprove({
      method: "PATCH",
      body: { id, status: "approved" },
      onSuccess: () => {
        refetch();
      },
      onError: () => {
        // Revert optimistic update on failure
        setLocalOverrides((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      },
    });
    if (result) {
      // Clear local override after successful refetch
      setLocalOverrides((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleReject = async (id: number) => {
    // Optimistic update
    setLocalOverrides((prev) => ({ ...prev, [id]: "rejected" }));
    const result = await mutateReject({
      method: "PATCH",
      body: { id, status: "rejected" },
      onSuccess: () => {
        refetch();
      },
      onError: () => {
        // Revert optimistic update on failure
        setLocalOverrides((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      },
    });
    if (result) {
      setLocalOverrides((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  if (loading) {
    return (
      <AppShell title="คำขอทำงานล่วงเวลา" subtitle="จัดการคำขอ OT ของพนักงาน">
        <LoadingSkeleton />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="คำขอทำงานล่วงเวลา" subtitle="จัดการคำขอ OT ของพนักงาน">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }

  return (
    <AppShell title="คำขอทำงานล่วงเวลา" subtitle="จัดการคำขอ OT ของพนักงาน">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="รออนุมัติ" value={totalPending} icon={Hourglass} color="bg-brown-500" />
        <StatCard title="อนุมัติแล้ว" value={totalApproved} icon={CheckCircle2} color="bg-brand-dark" />
        <StatCard title="ไม่อนุมัติ" value={totalRejected} icon={XCircle} color="bg-accent-brand-500" />
        <StatCard title="ชั่วโมง OT รวม" value={totalHours} icon={Clock} color="bg-brand-700" subtitle="เฉพาะที่อนุมัติ" />
      </div>

      {/* Filter & Table */}
      <Card className="mt-6 border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-title">รายการคำขอ OT</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ทั้งหมด">ทั้งหมด</SelectItem>
                <SelectItem value="pending">รออนุมัติ</SelectItem>
                <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>พนักงาน</TableHead>
                <TableHead>แผนก</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead className="text-right">ชั่วโมง</TableHead>
                <TableHead>เหตุผล</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.name}</TableCell>
                  <TableCell className="text-sm">{req.department}</TableCell>
                  <TableCell className="text-sm">{req.date}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{req.hours}</TableCell>
                  <TableCell className="text-sm max-w-[240px] truncate">{req.reason}</TableCell>
                  <TableCell>
                    <Badge className={otStatusConfig[req.status].className}>
                      {otStatusConfig[req.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {req.status === "pending" ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          size="sm"
                          className="h-7 bg-brand-dark text-white hover:bg-brand-700 text-xs px-3"
                          onClick={() => handleApprove(req.id)}
                          disabled={savingApprove || savingReject}
                        >
                          อนุมัติ
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 border-accent-brand-500 text-accent-brand-500 hover:bg-accent-brand-50 text-xs px-3"
                          onClick={() => handleReject(req.id)}
                          disabled={savingApprove || savingReject}
                        >
                          ปฏิเสธ
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              ไม่มีคำขอ OT ที่ตรงกับตัวกรอง
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
