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
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  XCircle,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useApi } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";

// ---------- Types ----------
interface MyRecord {
  date: string;
  day: string;
  clockIn: string;
  clockOut: string;
  status: string;
  lateMin: number;
  otMin: number;
}

// ---------- Mock Data (fallback for dev without DB) ----------
const statusConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  present: {
    label: "มาปกติ",
    className: "bg-brand-dark text-white hover:bg-brand-dark",
    dotColor: "bg-brand-dark",
  },
  late: {
    label: "มาสาย",
    className: "bg-accent-brand-100 text-accent-brand-700 hover:bg-accent-brand-100",
    dotColor: "bg-accent-brand-500",
  },
  absent: {
    label: "ขาดงาน",
    className: "bg-accent-brand-500 text-white hover:bg-accent-brand-500",
    dotColor: "bg-red-500",
  },
  leave: {
    label: "ลางาน",
    className: "bg-brand-100 text-brand-dark hover:bg-brand-100",
    dotColor: "bg-brand-400",
  },
};

const mockMyRecords: MyRecord[] = [
  { date: "2026-02-20", day: "ศุกร์", clockIn: "08:55", clockOut: "18:02", status: "present", lateMin: 0, otMin: 0 },
  { date: "2026-02-19", day: "พฤหัสบดี", clockIn: "08:50", clockOut: "18:00", status: "present", lateMin: 0, otMin: 0 },
  { date: "2026-02-18", day: "พุธ", clockIn: "08:58", clockOut: "19:30", status: "present", lateMin: 0, otMin: 90 },
  { date: "2026-02-17", day: "อังคาร", clockIn: "09:10", clockOut: "18:00", status: "late", lateMin: 10, otMin: 0 },
  { date: "2026-02-16", day: "จันทร์", clockIn: "08:45", clockOut: "18:00", status: "present", lateMin: 0, otMin: 0 },
  { date: "2026-02-13", day: "ศุกร์", clockIn: "08:40", clockOut: "18:00", status: "present", lateMin: 0, otMin: 0 },
  { date: "2026-02-12", day: "พฤหัสบดี", clockIn: "-", clockOut: "-", status: "leave", lateMin: 0, otMin: 0 },
  { date: "2026-02-11", day: "พุธ", clockIn: "08:55", clockOut: "18:00", status: "present", lateMin: 0, otMin: 0 },
  { date: "2026-02-10", day: "อังคาร", clockIn: "08:50", clockOut: "20:00", status: "present", lateMin: 0, otMin: 120 },
  { date: "2026-02-09", day: "จันทร์", clockIn: "08:48", clockOut: "18:00", status: "present", lateMin: 0, otMin: 0 },
  { date: "2026-02-06", day: "ศุกร์", clockIn: "08:55", clockOut: "18:00", status: "present", lateMin: 0, otMin: 0 },
  { date: "2026-02-05", day: "พฤหัสบดี", clockIn: "08:42", clockOut: "18:30", status: "present", lateMin: 0, otMin: 30 },
  { date: "2026-02-04", day: "พุธ", clockIn: "09:08", clockOut: "18:00", status: "late", lateMin: 8, otMin: 0 },
  { date: "2026-02-03", day: "อังคาร", clockIn: "08:50", clockOut: "18:00", status: "present", lateMin: 0, otMin: 0 },
  { date: "2026-02-02", day: "จันทร์", clockIn: "08:55", clockOut: "18:00", status: "present", lateMin: 0, otMin: 0 },
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

function MyCalendar({ records }: { records: MyRecord[] }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const baseDate = new Date(2026, 1 + monthOffset, 1);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthName = baseDate.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
  const dayHeaders = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  const now = new Date();
  const today = now.getDate();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

  // Build calendar data from records
  const myCalendarData = useMemo(() => {
    const map: Record<number, string> = {};
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    records.forEach((r) => {
      if (r.date.startsWith(monthStr)) {
        const day = parseInt(r.date.split("-")[2], 10);
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
          <CardTitle className="text-lg font-title">ปฏิทินของฉัน</CardTitle>
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
          {cells.map((day, i) => {
            const status = day ? myCalendarData[day] : undefined;
            const isToday = day === today && isCurrentMonth && monthOffset === 0;
            return (
              <div
                key={i}
                className={`relative flex flex-col items-center justify-center rounded-md py-2.5 text-sm ${
                  isToday ? "bg-brand-dark text-white font-bold" : day ? "hover:bg-brand-50" : ""
                }`}
              >
                {day && (
                  <>
                    <span>{day}</span>
                    {status && !isToday && (
                      <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${statusConfig[status].dotColor}`} />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 border-t pt-3">
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${cfg.dotColor}`} />
              <span className="text-xs text-muted-foreground">{cfg.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Page ----------
export default function MyAttendancePage() {
  const now = new Date();
  const currentFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const currentTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const { data: apiRecords, loading, error, refetch } = useApi<MyRecord[]>(
    `/api/attendance/records?userId=current&from=${currentFrom}&to=${currentTo}`
  );

  // Use API data or fallback to mock data for dev without DB
  const myRecords = apiRecords ?? mockMyRecords;

  const presentDays = myRecords.filter((r) => r.status === "present").length;
  const lateDays = myRecords.filter((r) => r.status === "late").length;
  const absentDays = myRecords.filter((r) => r.status === "absent").length;
  const leaveDays = myRecords.filter((r) => r.status === "leave").length;

  if (loading) {
    return (
      <AppShell title="การเข้างานของฉัน" subtitle="ข้อมูลการเข้างานส่วนตัว">
        <LoadingSkeleton />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="การเข้างานของฉัน" subtitle="ข้อมูลการเข้างานส่วนตัว">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }

  return (
    <AppShell title="การเข้างานของฉัน" subtitle="ข้อมูลการเข้างานส่วนตัว เดือนกุมภาพันธ์ 2569">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="วันทำงาน" value={presentDays} icon={CheckCircle2} color="bg-brand-dark" />
        <StatCard title="มาสาย" value={lateDays} icon={Clock} color="bg-accent-brand-500" />
        <StatCard title="ขาดงาน" value={absentDays} icon={XCircle} color="bg-red-500" />
        <StatCard title="ลางาน" value={leaveDays} icon={CalendarOff} color="bg-brown-500" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Calendar */}
        <MyCalendar records={myRecords} />

        {/* Records */}
        <Card className="border-none shadow-sm xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-title">
              รายการเข้างานเดือนนี้
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่</TableHead>
                  <TableHead>วัน</TableHead>
                  <TableHead>เวลาเข้า</TableHead>
                  <TableHead>เวลาออก</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">สาย (นาที)</TableHead>
                  <TableHead className="text-right">OT (นาที)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myRecords.map((record) => (
                  <TableRow key={record.date}>
                    <TableCell className="text-sm">{record.date}</TableCell>
                    <TableCell className="text-sm">{record.day}</TableCell>
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
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
