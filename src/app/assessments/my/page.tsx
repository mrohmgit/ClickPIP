"use client";

import Link from "next/link";
import { useApi } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardList,
  FileEdit,
  Eye,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
} from "lucide-react";

interface MyCycle {
  id: string;
  name: string;
  type: "quarter" | "half_year" | "yearly";
  periodStart: string;
  periodEnd: string;
  selfDeadline: string;
  selfStatus: "pending" | "submitted";
  managerStatus: "pending" | "submitted";
  finalScore: number | null;
  grade: string | null;
}

// ─── Fallback mockup data for dev without DB ─────────────────────────────────
const mockMyCycles: MyCycle[] = [
  {
    id: "ac-1",
    name: "ประเมินผลงาน Q1/2026",
    type: "quarter",
    periodStart: "2026-01-01",
    periodEnd: "2026-03-31",
    selfDeadline: "2026-04-07",
    selfStatus: "pending",
    managerStatus: "pending",
    finalScore: null,
    grade: null,
  },
  {
    id: "ac-2",
    name: "ประเมินผลงาน H2/2025",
    type: "half_year",
    periodStart: "2025-07-01",
    periodEnd: "2025-12-31",
    selfDeadline: "2026-01-10",
    selfStatus: "submitted",
    managerStatus: "submitted",
    finalScore: 82,
    grade: "B+",
  },
  {
    id: "ac-3",
    name: "ประเมินผลงานประจำปี 2025",
    type: "yearly",
    periodStart: "2025-01-01",
    periodEnd: "2025-12-31",
    selfDeadline: "2026-01-15",
    selfStatus: "submitted",
    managerStatus: "submitted",
    finalScore: 85,
    grade: "B+",
  },
  {
    id: "ac-4",
    name: "ประเมินผลงาน Q4/2025",
    type: "quarter",
    periodStart: "2025-10-01",
    periodEnd: "2025-12-31",
    selfDeadline: "2026-01-05",
    selfStatus: "submitted",
    managerStatus: "submitted",
    finalScore: 78,
    grade: "B",
  },
  {
    id: "ac-old1",
    name: "ประเมินผลงาน Q3/2025",
    type: "quarter",
    periodStart: "2025-07-01",
    periodEnd: "2025-09-30",
    selfDeadline: "2025-10-07",
    selfStatus: "submitted",
    managerStatus: "submitted",
    finalScore: 72,
    grade: "B",
  },
  {
    id: "ac-old2",
    name: "ประเมินผลงาน H1/2025",
    type: "half_year",
    periodStart: "2025-01-01",
    periodEnd: "2025-06-30",
    selfDeadline: "2025-07-10",
    selfStatus: "submitted",
    managerStatus: "submitted",
    finalScore: 88,
    grade: "B+",
  },
];

const typeConfig: Record<string, { label: string; className: string }> = {
  quarter: { label: "Q", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  half_year: { label: "H", className: "bg-purple-100 text-purple-700 hover:bg-purple-100" },
  yearly: { label: "Y", className: "bg-green-100 text-green-700 hover:bg-green-100" },
};

function getGradeClassName(grade: string | null): string {
  if (!grade) return "";
  if (grade === "A") return "bg-brand-500 text-white";
  if (grade === "B+") return "bg-brand-dark text-white";
  if (grade === "B") return "bg-brand-100 text-brand-dark";
  if (grade === "C+") return "bg-brown-200 text-brown-800";
  if (grade === "C") return "bg-brown-300 text-brown-900";
  return "bg-accent-brand-100 text-accent-brand-700";
}

export default function MyAssessmentsPage() {
  const { data: apiCycles, loading, error, refetch } = useApi<MyCycle[]>(
    "/api/assessments/submissions?employeeId=current"
  );

  const myCycles = apiCycles ?? mockMyCycles;

  const pendingCycles = myCycles.filter((c) => c.selfStatus === "pending");
  const completedCycles = myCycles.filter(
    (c) => c.selfStatus === "submitted" && c.finalScore !== null
  );
  const avgGrade =
    completedCycles.length > 0
      ? Math.round(
          completedCycles.reduce((a, c) => a + (c.finalScore || 0), 0) /
            completedCycles.length
        )
      : 0;

  return (
    <AppShell
      title="การประเมินของฉัน"
      subtitle="รายการรอบประเมินผลงานของคุณ"
    >
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
                <div className="rounded-lg bg-brown-100 p-2.5">
                  <Clock className="h-5 w-5 text-brown-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">รอประเมินตนเอง</p>
                  <p className="text-2xl font-bold font-title">{pendingCycles.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-brand-100 p-2.5">
                  <CheckCircle2 className="h-5 w-5 text-brand-dark" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ประเมินเสร็จ</p>
                  <p className="text-2xl font-bold font-title">{completedCycles.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-brand-100 p-2.5">
                  <TrendingUp className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">คะแนนเฉลี่ย</p>
                  <p className="text-2xl font-bold font-title text-brand-dark">{avgGrade}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Assessments */}
          {pendingCycles.length > 0 && (
            <Card className="mb-6 border-none shadow-sm border-l-4 border-l-brand-dark">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-title">
                  <ClipboardList className="h-4 w-4 text-brand-dark" />
                  รอประเมินตนเอง
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingCycles.map((cycle) => (
                  <div
                    key={cycle.id}
                    className="flex items-center justify-between rounded-lg border bg-brand-50/50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={typeConfig[cycle.type].className}>
                        {typeConfig[cycle.type].label}
                      </Badge>
                      <div>
                        <p className="font-medium">{cycle.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ช่วงเวลา: {cycle.periodStart} — {cycle.periodEnd}
                        </p>
                        <p className="text-xs text-accent-brand-500 font-medium">
                          กำหนดส่ง: {cycle.selfDeadline}
                        </p>
                      </div>
                    </div>
                    <Link href={`/assessments/my/${cycle.id}`}>
                      <Button size="sm" className="bg-brand-dark hover:bg-brand-700">
                        <FileEdit className="mr-2 h-4 w-4" />
                        ประเมินตนเอง
                      </Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* History Table */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-title">
                <Award className="h-4 w-4 text-brand-dark" />
                ประวัติการประเมิน
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รอบประเมิน</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>ช่วงเวลา</TableHead>
                    <TableHead className="text-center">สถานะประเมินตนเอง</TableHead>
                    <TableHead className="text-center">สถานะรีวิว</TableHead>
                    <TableHead className="text-center">คะแนน</TableHead>
                    <TableHead className="text-center">เกรด</TableHead>
                    <TableHead className="w-[80px]">ดู</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myCycles.map((cycle) => (
                    <TableRow key={cycle.id} className="hover:bg-brand-50/50">
                      <TableCell className="font-medium">{cycle.name}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${typeConfig[cycle.type].className}`}>
                          {typeConfig[cycle.type].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {cycle.periodStart} — {cycle.periodEnd}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={
                            cycle.selfStatus === "submitted"
                              ? "bg-brand-100 text-brand-dark hover:bg-brand-100"
                              : "bg-brown-200 text-brown-800 hover:bg-brown-200"
                          }
                        >
                          {cycle.selfStatus === "submitted" ? "ส่งแล้ว" : "รอส่ง"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={
                            cycle.managerStatus === "submitted"
                              ? "bg-brand-500 text-white hover:bg-brand-500"
                              : "bg-brown-200 text-brown-800 hover:bg-brown-200"
                          }
                        >
                          {cycle.managerStatus === "submitted" ? "รีวิวแล้ว" : "รอรีวิว"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {cycle.finalScore !== null ? (
                          <span className="font-medium">{cycle.finalScore}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {cycle.grade ? (
                          <Badge className={`${getGradeClassName(cycle.grade)} hover:${getGradeClassName(cycle.grade)}`}>
                            {cycle.grade}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cycle.selfStatus === "pending" ? (
                          <Link href={`/assessments/my/${cycle.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-brand-dark hover:bg-brand-50"
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                          </Link>
                        ) : (
                          <Link href={`/assessments/my/${cycle.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-brand-dark hover:bg-brand-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}
