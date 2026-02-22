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
import {
  CheckCircle2,
  Clock,
  XCircle,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useApi } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";

// ---------- Types ----------
interface AttendanceRecord {
  id: number;
  name: string;
  department: string;
  date: string;
  clockIn: string;
  clockOut: string;
  status: string;
}

// ---------- Mock Data (fallback for dev without DB) ----------
const departments = ["ทั้งหมด", "วิศวกรรม", "การตลาด", "บุคคล", "การเงิน", "ปฏิบัติการ"];

const attendanceStatusConfig: Record<
  string,
  { label: string; className: string }
> = {
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

const mockRecentRecords: AttendanceRecord[] = [
  { id: 1, name: "สมชาย ใจดี", department: "วิศวกรรม", date: "2026-02-20", clockIn: "08:55", clockOut: "18:02", status: "present" },
  { id: 2, name: "สมหญิง รักงาน", department: "การตลาด", date: "2026-02-20", clockIn: "09:15", clockOut: "18:30", status: "late" },
  { id: 3, name: "วิชัย สุขสบาย", department: "บุคคล", date: "2026-02-20", clockIn: "-", clockOut: "-", status: "absent" },
  { id: 4, name: "พิมพ์ใจ แสนสุข", department: "การเงิน", date: "2026-02-20", clockIn: "-", clockOut: "-", status: "leave" },
  { id: 5, name: "อนันต์ ทำดี", department: "วิศวกรรม", date: "2026-02-20", clockIn: "08:45", clockOut: "18:00", status: "present" },
  { id: 6, name: "กัลยา อยู่ดี", department: "ปฏิบัติการ", date: "2026-02-20", clockIn: "09:05", clockOut: "18:10", status: "late" },
  { id: 7, name: "ธนกร มั่นคง", department: "การตลาด", date: "2026-02-19", clockIn: "08:50", clockOut: "18:00", status: "present" },
  { id: 8, name: "นภา สดใส", department: "วิศวกรรม", date: "2026-02-19", clockIn: "08:58", clockOut: "17:55", status: "present" },
];

const statusDotColor: Record<string, string> = {
  present: "bg-brand-dark",
  late: "bg-accent-brand-500",
  absent: "bg-red-500",
  leave: "bg-brand-400",
};

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

function MiniCalendar({ records }: { records: AttendanceRecord[] }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const baseDate = new Date(2026, 1 + monthOffset, 1); // Feb 2026
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
  const monthName = baseDate.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
  const dayHeaders = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  // Build calendar data from records
  const calendarData = useMemo(() => {
    const map: Record<number, string> = {};
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    records.forEach((r) => {
      if (r.date.startsWith(monthStr)) {
        const day = parseInt(r.date.split("-")[2], 10);
        // Keep the first status found for each day (or worst status)
        if (!map[day]) map[day] = r.status;
      }
    });
    return map;
  }, [records, year, month]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-title">ปฏิทินการเข้างาน</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMonthOffset(monthOffset - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">{monthName}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMonthOffset(monthOffset + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-7 gap-1">
          {dayHeaders.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
              {d}
            </div>
          ))}
          {cells.map((day, i) => (
            <div
              key={i}
              className={`relative flex flex-col items-center justify-center rounded-md py-2 text-sm ${
                day ? "hover:bg-brand-50 cursor-default" : ""
              }`}
            >
              {day && (
                <>
                  <span className="text-sm">{day}</span>
                  {calendarData[day] && (
                    <span
                      className={`mt-0.5 h-1.5 w-1.5 rounded-full ${statusDotColor[calendarData[day]]}`}
                    />
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 border-t pt-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-dark" />
            <span className="text-xs text-muted-foreground">มาปกติ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent-brand-500" />
            <span className="text-xs text-muted-foreground">มาสาย</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">ขาดงาน</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-400" />
            <span className="text-xs text-muted-foreground">ลางาน</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Page ----------
export default function AttendanceDashboardPage() {
  const [department, setDepartment] = useState("ทั้งหมด");
  const [dateFrom, setDateFrom] = useState("2026-02-01");
  const [dateTo, setDateTo] = useState("2026-02-20");

  const { data: apiRecords, loading, error, refetch } = useApi<AttendanceRecord[]>(
    `/api/attendance/records?from=${dateFrom}&to=${dateTo}`
  );

  // Use API data or fallback to mock data for dev without DB
  const records = apiRecords ?? mockRecentRecords;

  const filteredRecords =
    department === "ทั้งหมด"
      ? records
      : records.filter((r) => r.department === department);

  // Compute stats from fetched records (today's records)
  const todayRecords = records.filter((r) => r.date === dateTo);
  const stats = useMemo(() => {
    const present = todayRecords.filter((r) => r.status === "present").length;
    const late = todayRecords.filter((r) => r.status === "late").length;
    const absent = todayRecords.filter((r) => r.status === "absent").length;
    const leave = todayRecords.filter((r) => r.status === "leave").length;
    const total = present + late + absent + leave;
    return { present, late, absent, leave, total };
  }, [todayRecords]);

  if (loading) {
    return (
      <AppShell title="การเข้างาน" subtitle="ภาพรวมข้อมูลการเข้างานของพนักงาน">
        <LoadingSkeleton />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="การเข้างาน" subtitle="ภาพรวมข้อมูลการเข้างานของพนักงาน">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }

  return (
    <AppShell title="การเข้างาน" subtitle="ภาพรวมข้อมูลการเข้างานของพนักงาน">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="มาปกติวันนี้"
          value={stats.present}
          icon={CheckCircle2}
          color="bg-brand-dark"
          subtitle={`จาก ${stats.total} คน`}
        />
        <StatCard
          title="มาสายวันนี้"
          value={stats.late}
          icon={Clock}
          color="bg-accent-brand-500"
        />
        <StatCard
          title="ขาดงาน"
          value={stats.absent}
          icon={XCircle}
          color="bg-red-500"
        />
        <StatCard
          title="ลางาน"
          value={stats.leave}
          icon={CalendarOff}
          color="bg-brown-500"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Calendar */}
        <MiniCalendar records={records} />

        {/* Recent Records Table */}
        <Card className="border-none shadow-sm xl:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg font-title">บันทึกล่าสุด</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-8 w-36 text-xs"
                />
                <span className="text-sm text-muted-foreground">ถึง</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-8 w-36 text-xs"
                />
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="h-8 w-32 text-xs">
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
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>พนักงาน</TableHead>
                  <TableHead>แผนก</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>เข้างาน</TableHead>
                  <TableHead>ออกงาน</TableHead>
                  <TableHead>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.name}</TableCell>
                    <TableCell className="text-sm">{record.department}</TableCell>
                    <TableCell className="text-sm">{record.date}</TableCell>
                    <TableCell className="text-sm">{record.clockIn}</TableCell>
                    <TableCell className="text-sm">{record.clockOut}</TableCell>
                    <TableCell>
                      <Badge className={attendanceStatusConfig[record.status].className}>
                        {attendanceStatusConfig[record.status].label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-end">
              <Link href="/attendance/daily">
                <Button variant="ghost" size="sm" className="text-brand-dark">
                  ดูรายละเอียดรายวัน <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
