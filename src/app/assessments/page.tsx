"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useApi } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";
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
import {
  PlusCircle,
  Search,
  Eye,
  Filter,
  ClipboardList,
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react";

type CycleType = "quarter" | "half_year" | "yearly";
type CycleStatus = "draft" | "open" | "review" | "completed";

interface AssessmentCycle {
  id: string;
  name: string;
  type: CycleType;
  periodStart: string;
  periodEnd: string;
  selfDeadline: string;
  managerDeadline: string;
  status: CycleStatus;
  totalEmployees: number;
  completedSelf: number;
  completedReview: number;
}

// ─── Fallback mockup data for dev without DB ─────────────────────────────────
const mockCycles: AssessmentCycle[] = [
  {
    id: "ac-1",
    name: "ประเมินผลงาน Q1/2026",
    type: "quarter",
    periodStart: "2026-01-01",
    periodEnd: "2026-03-31",
    selfDeadline: "2026-04-07",
    managerDeadline: "2026-04-15",
    status: "open",
    totalEmployees: 45,
    completedSelf: 28,
    completedReview: 12,
  },
  {
    id: "ac-2",
    name: "ประเมินผลงาน H2/2025",
    type: "half_year",
    periodStart: "2025-07-01",
    periodEnd: "2025-12-31",
    selfDeadline: "2026-01-10",
    managerDeadline: "2026-01-20",
    status: "completed",
    totalEmployees: 42,
    completedSelf: 42,
    completedReview: 42,
  },
  {
    id: "ac-3",
    name: "ประเมินผลงานประจำปี 2025",
    type: "yearly",
    periodStart: "2025-01-01",
    periodEnd: "2025-12-31",
    selfDeadline: "2026-01-15",
    managerDeadline: "2026-01-25",
    status: "completed",
    totalEmployees: 42,
    completedSelf: 42,
    completedReview: 42,
  },
  {
    id: "ac-4",
    name: "ประเมินผลงาน Q4/2025",
    type: "quarter",
    periodStart: "2025-10-01",
    periodEnd: "2025-12-31",
    selfDeadline: "2026-01-05",
    managerDeadline: "2026-01-12",
    status: "completed",
    totalEmployees: 42,
    completedSelf: 42,
    completedReview: 42,
  },
  {
    id: "ac-5",
    name: "ประเมินผลงาน Q2/2026",
    type: "quarter",
    periodStart: "2026-04-01",
    periodEnd: "2026-06-30",
    selfDeadline: "2026-07-07",
    managerDeadline: "2026-07-15",
    status: "draft",
    totalEmployees: 45,
    completedSelf: 0,
    completedReview: 0,
  },
  {
    id: "ac-6",
    name: "ประเมินผลงาน H1/2026",
    type: "half_year",
    periodStart: "2026-01-01",
    periodEnd: "2026-06-30",
    selfDeadline: "2026-07-10",
    managerDeadline: "2026-07-20",
    status: "draft",
    totalEmployees: 45,
    completedSelf: 0,
    completedReview: 0,
  },
];

const statusConfig: Record<CycleStatus, { label: string; className: string }> = {
  draft: {
    label: "ฉบับร่าง",
    className: "bg-brown-200 text-brown-800 hover:bg-brown-200",
  },
  open: {
    label: "เปิดรับประเมิน",
    className: "bg-brand-dark text-white hover:bg-brand-dark",
  },
  review: {
    label: "อยู่ระหว่างรีวิว",
    className: "bg-brand-100 text-brand-dark hover:bg-brand-100",
  },
  completed: {
    label: "เสร็จสมบูรณ์",
    className: "bg-brand-500 text-white hover:bg-brand-500",
  },
};

const typeConfig: Record<CycleType, { label: string; className: string }> = {
  quarter: {
    label: "Q",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  half_year: {
    label: "H",
    className: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  },
  yearly: {
    label: "Y",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
};

const typeLabels: Record<CycleType, string> = {
  quarter: "รายไตรมาส",
  half_year: "ครึ่งปี",
  yearly: "รายปี",
};

export default function AssessmentsPage() {
  const { data: apiCycles, loading, error, refetch } = useApi<AssessmentCycle[]>("/api/assessments/cycles");

  const cycles = apiCycles ?? mockCycles;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredCycles = useMemo(() => {
    return cycles.filter((cycle) => {
      if (statusFilter !== "all" && cycle.status !== statusFilter) return false;
      if (typeFilter !== "all" && cycle.type !== typeFilter) return false;
      if (searchQuery && !cycle.name.includes(searchQuery)) return false;
      return true;
    });
  }, [cycles, searchQuery, statusFilter, typeFilter]);

  const activeCycles = cycles.filter(
    (c) => c.status === "open" || c.status === "review"
  ).length;
  const pendingReviews = cycles.reduce(
    (sum, c) => sum + (c.totalEmployees - c.completedReview),
    0
  );
  const completedThisYear = cycles.filter(
    (c) => c.status === "completed"
  ).length;

  return (
    <AppShell title="รอบประเมินผลงาน" subtitle="จัดการรอบการประเมินผลงานพนักงาน">
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="border-none shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-brand-100 p-2.5">
                  <ClipboardList className="h-5 w-5 text-brand-dark" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">รอบที่เปิดอยู่</p>
                  <p className="text-2xl font-bold font-title">{activeCycles}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-brown-100 p-2.5">
                  <Clock className="h-5 w-5 text-brown-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">รอรีวิว</p>
                  <p className="text-2xl font-bold font-title">{pendingReviews}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-brand-100 p-2.5">
                  <CheckCircle2 className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">เสร็จสมบูรณ์ปีนี้</p>
                  <p className="text-2xl font-bold font-title">{completedThisYear}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Actions */}
          <Card className="mb-4 border-none shadow-sm">
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาชื่อรอบประเมิน..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="draft">ฉบับร่าง</SelectItem>
                  <SelectItem value="open">เปิดรับประเมิน</SelectItem>
                  <SelectItem value="review">อยู่ระหว่างรีวิว</SelectItem>
                  <SelectItem value="completed">เสร็จสมบูรณ์</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="ประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกประเภท</SelectItem>
                  <SelectItem value="quarter">รายไตรมาส</SelectItem>
                  <SelectItem value="half_year">ครึ่งปี</SelectItem>
                  <SelectItem value="yearly">รายปี</SelectItem>
                </SelectContent>
              </Select>
              <Link href="/assessments/create">
                <Button size="sm" className="bg-brand-dark hover:bg-brand-700">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  สร้างรอบประเมินใหม่
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Cycles Table */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-title">
                รอบประเมินทั้งหมด ({filteredCycles.length} รอบ)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อรอบ</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>ช่วงเวลา</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>กำหนดส่ง (ตนเอง)</TableHead>
                    <TableHead>กำหนดส่ง (หัวหน้า)</TableHead>
                    <TableHead className="text-center">ความคืบหน้า</TableHead>
                    <TableHead className="w-[80px]">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCycles.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-12 text-center text-muted-foreground"
                      >
                        ไม่พบรอบประเมินที่ตรงกับเงื่อนไข
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCycles.map((cycle) => (
                      <TableRow key={cycle.id} className="hover:bg-brand-50/50">
                        <TableCell>
                          <p className="font-medium">{cycle.name}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${typeConfig[cycle.type].className}`}>
                            {typeConfig[cycle.type].label}
                          </Badge>
                          <span className="ml-1 text-xs text-muted-foreground">
                            {typeLabels[cycle.type]}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {cycle.periodStart} — {cycle.periodEnd}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[cycle.status].className}>
                            {statusConfig[cycle.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{cycle.selfDeadline}</TableCell>
                        <TableCell className="text-sm">{cycle.managerDeadline}</TableCell>
                        <TableCell className="text-center">
                          <div className="text-xs">
                            <span className="text-brand-dark font-medium">
                              {cycle.completedSelf}/{cycle.totalEmployees}
                            </span>
                            <span className="text-muted-foreground"> ประเมินตนเอง</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-brand-100">
                            <div
                              className="h-1.5 rounded-full bg-brand-dark transition-all"
                              style={{
                                width: `${
                                  cycle.totalEmployees > 0
                                    ? (cycle.completedSelf / cycle.totalEmployees) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/assessments/${cycle.id}`}>
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
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}
