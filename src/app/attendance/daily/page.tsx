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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";

// ---------- Types ----------
interface DailyRecord {
  id: number;
  name: string;
  department: string;
  clockIn: string;
  clockOut: string;
  status: string;
  lateMin: number;
  otMin: number;
}

// ---------- Mock Data (fallback for dev without DB) ----------
const departments = ["ทั้งหมด", "วิศวกรรม", "การตลาด", "บุคคล", "การเงิน", "ปฏิบัติการ"];

const statusConfig: Record<string, { label: string; className: string }> = {
  present: {
    label: "มาปกติ",
    className: "bg-brand-dark text-white hover:bg-brand-dark",
  },
  late: {
    label: "มาสาย",
    className: "bg-accent-brand-100 text-accent-brand-700 hover:bg-accent-brand-100",
  },
  absent: {
    label: "ขาดงาน",
    className: "bg-accent-brand-500 text-white hover:bg-accent-brand-500",
  },
  leave: {
    label: "ลางาน",
    className: "bg-brand-100 text-brand-dark hover:bg-brand-100",
  },
};

const mockDailyRecords: DailyRecord[] = [
  { id: 1, name: "สมชาย ใจดี", department: "วิศวกรรม", clockIn: "08:55", clockOut: "18:02", status: "present", lateMin: 0, otMin: 0 },
  { id: 2, name: "สมหญิง รักงาน", department: "การตลาด", clockIn: "09:15", clockOut: "18:30", status: "late", lateMin: 15, otMin: 30 },
  { id: 3, name: "วิชัย สุขสบาย", department: "บุคคล", clockIn: "-", clockOut: "-", status: "absent", lateMin: 0, otMin: 0 },
  { id: 4, name: "พิมพ์ใจ แสนสุข", department: "การเงิน", clockIn: "-", clockOut: "-", status: "leave", lateMin: 0, otMin: 0 },
  { id: 5, name: "อนันต์ ทำดี", department: "วิศวกรรม", clockIn: "08:45", clockOut: "20:00", status: "present", lateMin: 0, otMin: 120 },
  { id: 6, name: "กัลยา อยู่ดี", department: "ปฏิบัติการ", clockIn: "09:05", clockOut: "18:10", status: "late", lateMin: 5, otMin: 10 },
  { id: 7, name: "ธนกร มั่นคง", department: "การตลาด", clockIn: "08:50", clockOut: "18:00", status: "present", lateMin: 0, otMin: 0 },
  { id: 8, name: "นภา สดใส", department: "วิศวกรรม", clockIn: "08:58", clockOut: "17:55", status: "present", lateMin: 0, otMin: 0 },
  { id: 9, name: "ประภาส รุ่งเรือง", department: "การเงิน", clockIn: "08:30", clockOut: "19:30", status: "present", lateMin: 0, otMin: 90 },
  { id: 10, name: "รัตนา ศรีสุข", department: "บุคคล", clockIn: "09:20", clockOut: "18:00", status: "late", lateMin: 20, otMin: 0 },
  { id: 11, name: "มานะ พากเพียร", department: "ปฏิบัติการ", clockIn: "08:40", clockOut: "18:00", status: "present", lateMin: 0, otMin: 0 },
  { id: 12, name: "สุดา ใจงาม", department: "วิศวกรรม", clockIn: "08:59", clockOut: "21:00", status: "present", lateMin: 0, otMin: 180 },
];

// ---------- Page ----------
export default function DailyAttendancePage() {
  const [selectedDate, setSelectedDate] = useState("2026-02-20");
  const [department, setDepartment] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");

  const { data: apiRecords, loading, error, refetch } = useApi<DailyRecord[]>(
    `/api/attendance/records?date=${selectedDate}`
  );

  // Use API data or fallback to mock data for dev without DB
  const dailyRecords = apiRecords ?? mockDailyRecords;

  const filtered = useMemo(() => {
    return dailyRecords.filter((r) => {
      const matchDept = department === "ทั้งหมด" || r.department === department;
      const matchSearch = r.name.includes(search) || search === "";
      return matchDept && matchSearch;
    });
  }, [dailyRecords, department, search]);

  const totalPresent = filtered.filter((r) => r.status === "present").length;
  const totalLate = filtered.filter((r) => r.status === "late").length;
  const totalAbsent = filtered.filter((r) => r.status === "absent").length;
  const totalLeave = filtered.filter((r) => r.status === "leave").length;

  if (loading) {
    return (
      <AppShell title="บันทึกรายวัน" subtitle="รายละเอียดการเข้า-ออกงานรายวัน">
        <LoadingSkeleton />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="บันทึกรายวัน" subtitle="รายละเอียดการเข้า-ออกงานรายวัน">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }

  return (
    <AppShell title="บันทึกรายวัน" subtitle="รายละเอียดการเข้า-ออกงานรายวัน">
      {/* Controls */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">วันที่:</span>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 w-44"
              />
            </div>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อพนักงาน..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9"
              />
            </div>
            <Button variant="outline" className="h-9 gap-2">
              <Download className="h-4 w-4" />
              ส่งออก Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Badges */}
      <div className="mt-4 flex flex-wrap gap-3">
        <Badge className="bg-brand-dark text-white hover:bg-brand-dark px-3 py-1 text-sm">
          มาปกติ {totalPresent} คน
        </Badge>
        <Badge className="bg-accent-brand-100 text-accent-brand-700 hover:bg-accent-brand-100 px-3 py-1 text-sm">
          มาสาย {totalLate} คน
        </Badge>
        <Badge className="bg-accent-brand-500 text-white hover:bg-accent-brand-500 px-3 py-1 text-sm">
          ขาดงาน {totalAbsent} คน
        </Badge>
        <Badge className="bg-brand-100 text-brand-dark hover:bg-brand-100 px-3 py-1 text-sm">
          ลางาน {totalLeave} คน
        </Badge>
      </div>

      {/* Table */}
      <Card className="mt-4 border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-title">
            รายการเข้างาน - {selectedDate}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>ชื่อพนักงาน</TableHead>
                <TableHead>แผนก</TableHead>
                <TableHead>เวลาเข้า</TableHead>
                <TableHead>เวลาออก</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">สาย (นาที)</TableHead>
                <TableHead className="text-right">OT (นาที)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((record, index) => (
                <TableRow key={record.id}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell className="text-sm">{record.department}</TableCell>
                  <TableCell className="text-sm font-mono">{record.clockIn}</TableCell>
                  <TableCell className="text-sm font-mono">{record.clockOut}</TableCell>
                  <TableCell>
                    <Badge className={statusConfig[record.status].className}>
                      {statusConfig[record.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {record.lateMin > 0 ? (
                      <span className="text-accent-brand-600 font-medium">{record.lateMin}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {record.otMin > 0 ? (
                      <span className="text-brand-dark font-medium">{record.otMin}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              ไม่พบข้อมูลการเข้างาน
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
