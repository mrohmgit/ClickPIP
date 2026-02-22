"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useApi, useApiMutation } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileEdit,
  Users,
} from "lucide-react";

type CycleStatus = "draft" | "open" | "review" | "completed";

interface CycleEmployee {
  id: string;
  name: string;
  department: string;
  position: string;
  selfStatus: "pending" | "submitted";
  managerStatus: "pending" | "submitted";
  finalScore: number | null;
  grade: string | null;
}

interface CycleDetail {
  id: string;
  name: string;
  type: "quarter" | "half_year" | "yearly";
  periodStart: string;
  periodEnd: string;
  selfDeadline: string;
  managerDeadline: string;
  status: CycleStatus;
  totalEmployees: number;
  employees: CycleEmployee[];
}

// ─── Fallback mockup data for dev without DB ─────────────────────────────────
const mockCycleDetail: CycleDetail = {
  id: "ac-1",
  name: "ประเมินผลงาน Q1/2026",
  type: "quarter",
  periodStart: "2026-01-01",
  periodEnd: "2026-03-31",
  selfDeadline: "2026-04-07",
  managerDeadline: "2026-04-15",
  status: "open",
  totalEmployees: 12,
  employees: [
    { id: "e1", name: "สมชาย ใจดี", department: "ฝ่ายขาย", position: "พนักงานขาย", selfStatus: "submitted", managerStatus: "submitted", finalScore: 85, grade: "B+" },
    { id: "e2", name: "สมหญิง รักเรียน", department: "ฝ่ายขาย", position: "พนักงานขายอาวุโส", selfStatus: "submitted", managerStatus: "submitted", finalScore: 92, grade: "A" },
    { id: "e3", name: "วิชัย สุขสบาย", department: "ฝ่ายบัญชี", position: "นักบัญชี", selfStatus: "submitted", managerStatus: "pending", finalScore: null, grade: null },
    { id: "e4", name: "นภา แสงจันทร์", department: "ฝ่ายบุคคล", position: "เจ้าหน้าที่ HR", selfStatus: "submitted", managerStatus: "pending", finalScore: null, grade: null },
    { id: "e5", name: "ธนา ก้าวหน้า", department: "ฝ่ายไอที", position: "โปรแกรมเมอร์", selfStatus: "submitted", managerStatus: "submitted", finalScore: 78, grade: "B" },
    { id: "e6", name: "พิมพ์ใจ ดีงาม", department: "ฝ่ายการตลาด", position: "นักการตลาด", selfStatus: "submitted", managerStatus: "submitted", finalScore: 65, grade: "C+" },
    { id: "e7", name: "อนันต์ มีสุข", department: "ฝ่ายขาย", position: "พนักงานขาย", selfStatus: "pending", managerStatus: "pending", finalScore: null, grade: null },
    { id: "e8", name: "กมล แสนสุข", department: "ฝ่ายผลิต", position: "หัวหน้าสายผลิต", selfStatus: "submitted", managerStatus: "submitted", finalScore: 88, grade: "B+" },
    { id: "e9", name: "ปรีชา วิริยะ", department: "ฝ่ายไอที", position: "นักวิเคราะห์ระบบ", selfStatus: "submitted", managerStatus: "pending", finalScore: null, grade: null },
    { id: "e10", name: "ศิริพร งามตา", department: "ฝ่ายบัญชี", position: "นักบัญชีอาวุโส", selfStatus: "submitted", managerStatus: "submitted", finalScore: 71, grade: "B" },
    { id: "e11", name: "สุรัตน์ พัฒนา", department: "ฝ่ายผลิต", position: "ช่างเทคนิค", selfStatus: "pending", managerStatus: "pending", finalScore: null, grade: null },
    { id: "e12", name: "จิราภรณ์ ศรีสุข", department: "ฝ่ายการตลาด", position: "ผู้จัดการฝ่ายการตลาด", selfStatus: "submitted", managerStatus: "submitted", finalScore: 45, grade: "D" },
  ],
};

const statusConfig: Record<CycleStatus, { label: string; className: string }> = {
  draft: { label: "ฉบับร่าง", className: "bg-brown-200 text-brown-800 hover:bg-brown-200" },
  open: { label: "เปิดรับประเมิน", className: "bg-brand-dark text-white hover:bg-brand-dark" },
  review: { label: "อยู่ระหว่างรีวิว", className: "bg-brand-100 text-brand-dark hover:bg-brand-100" },
  completed: { label: "เสร็จสมบูรณ์", className: "bg-brand-500 text-white hover:bg-brand-500" },
};

const statusSteps: CycleStatus[] = ["draft", "open", "review", "completed"];
const statusStepLabels: Record<CycleStatus, string> = {
  draft: "ฉบับร่าง",
  open: "เปิดรับ",
  review: "รีวิว",
  completed: "เสร็จสิ้น",
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

function getNextStatus(current: CycleStatus): CycleStatus | null {
  const idx = statusSteps.indexOf(current);
  if (idx < statusSteps.length - 1) return statusSteps[idx + 1];
  return null;
}

export default function CycleDetailPage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = use(params);
  const { data: apiData, loading, error, refetch } = useApi<CycleDetail>(`/api/assessments/cycles/${cycleId}`);
  const { mutate: advanceStatus, loading: advancing } = useApiMutation(`/api/assessments/cycles/${cycleId}`);

  const cycleDetail = apiData ?? mockCycleDetail;
  const [localStatus, setLocalStatus] = useState<CycleStatus | null>(null);

  const cycleStatus = localStatus ?? cycleDetail.status;
  const employees = cycleDetail.employees;

  const completedSelf = employees.filter((e) => e.selfStatus === "submitted").length;
  const completedReview = employees.filter((e) => e.managerStatus === "submitted").length;
  const selfPercent = employees.length > 0 ? Math.round((completedSelf / employees.length) * 100) : 0;
  const reviewPercent = employees.length > 0 ? Math.round((completedReview / employees.length) * 100) : 0;

  const nextStatus = getNextStatus(cycleStatus);

  const handleAdvance = async () => {
    if (!nextStatus) return;
    await advanceStatus({
      method: "PUT",
      body: { status: nextStatus },
      onSuccess: () => {
        setLocalStatus(nextStatus);
      },
      onError: () => {
        // Fallback for dev without DB
        setLocalStatus(nextStatus);
      },
    });
  };

  const currentStepIndex = statusSteps.indexOf(cycleStatus);

  return (
    <AppShell
      title={cycleDetail.name}
      subtitle="รายละเอียดรอบประเมินผลงาน"
    >
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          {/* Back + Actions */}
          <div className="mb-4 flex items-center justify-between">
            <Link href="/assessments">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                กลับไปรายการรอบประเมิน
              </Button>
            </Link>
            {nextStatus && (
              <Button
                size="sm"
                className="bg-brand-dark hover:bg-brand-700"
                onClick={handleAdvance}
                disabled={advancing}
              >
                {advancing ? "กำลังดำเนินการ..." : `เปลี่ยนสถานะเป็น ${statusStepLabels[nextStatus]}`}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Cycle Info Card */}
          <Card className="mb-6 border-none shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">ชื่อรอบ</p>
                  <p className="mt-1 font-medium font-title">{cycleDetail.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ประเภท / ช่วงเวลา</p>
                  <p className="mt-1 text-sm">
                    {cycleDetail.type === "quarter"
                      ? "รายไตรมาส"
                      : cycleDetail.type === "half_year"
                        ? "ครึ่งปี"
                        : "รายปี"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {cycleDetail.periodStart} — {cycleDetail.periodEnd}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">สถานะ</p>
                  <Badge className={`mt-1 ${statusConfig[cycleStatus].className}`}>
                    {statusConfig[cycleStatus].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">กำหนดส่ง</p>
                  <p className="mt-1 text-sm">ประเมินตนเอง: {cycleDetail.selfDeadline}</p>
                  <p className="text-xs text-muted-foreground">
                    รีวิวหัวหน้า: {cycleDetail.managerDeadline}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Flow Indicator */}
          <Card className="mb-6 border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-title">สถานะรอบประเมิน</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {statusSteps.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <div key={step} className="flex flex-1 items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium ${
                            isCompleted
                              ? "border-brand-500 bg-brand-500 text-white"
                              : isCurrent
                                ? "border-brand-dark bg-brand-dark text-white"
                                : "border-brown-200 bg-white text-brown-400"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <span
                          className={`mt-2 text-xs ${
                            isCurrent
                              ? "font-medium text-brand-dark"
                              : isCompleted
                                ? "text-brand-500"
                                : "text-muted-foreground"
                          }`}
                        >
                          {statusStepLabels[step]}
                        </span>
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`mx-2 h-0.5 flex-1 ${
                            index < currentStepIndex
                              ? "bg-brand-500"
                              : "bg-brown-200"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Submission Progress */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-brand-100 p-2.5">
                    <ClipboardList className="h-5 w-5 text-brand-dark" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">ประเมินตนเอง</p>
                    <p className="text-lg font-bold font-title">
                      {completedSelf}/{employees.length}
                    </p>
                    <Progress
                      value={selfPercent}
                      className="mt-1 h-2 bg-brand-100 [&>div]:bg-brand-dark"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-brand-100 p-2.5">
                    <Users className="h-5 w-5 text-brand-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">รีวิวหัวหน้า</p>
                    <p className="text-lg font-bold font-title">
                      {completedReview}/{employees.length}
                    </p>
                    <Progress
                      value={reviewPercent}
                      className="mt-1 h-2 bg-brand-100 [&>div]:bg-brand-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employees Table */}
          <Card className="mb-6 border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-title">
                รายชื่อพนักงาน ({employees.length} คน)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>พนักงาน</TableHead>
                    <TableHead>แผนก</TableHead>
                    <TableHead className="text-center">ประเมินตนเอง</TableHead>
                    <TableHead className="text-center">รีวิวหัวหน้า</TableHead>
                    <TableHead className="text-center">คะแนน</TableHead>
                    <TableHead className="text-center">เกรด</TableHead>
                    <TableHead className="w-[100px]">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp, index) => (
                    <TableRow key={emp.id} className="hover:bg-brand-50/50">
                      <TableCell className="text-sm text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.position}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{emp.department}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={
                            emp.selfStatus === "submitted"
                              ? "bg-brand-100 text-brand-dark hover:bg-brand-100"
                              : "bg-brown-200 text-brown-800 hover:bg-brown-200"
                          }
                        >
                          {emp.selfStatus === "submitted" ? "ส่งแล้ว" : "รอส่ง"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={
                            emp.managerStatus === "submitted"
                              ? "bg-brand-500 text-white hover:bg-brand-500"
                              : "bg-brown-200 text-brown-800 hover:bg-brown-200"
                          }
                        >
                          {emp.managerStatus === "submitted" ? "รีวิวแล้ว" : "รอรีวิว"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {emp.finalScore !== null ? (
                          <span className="font-medium">{emp.finalScore}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {emp.grade ? (
                          <Badge className={`${getGradeClassName(emp.grade)} hover:${getGradeClassName(emp.grade)}`}>
                            {emp.grade}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {emp.selfStatus === "submitted" && emp.managerStatus === "pending" && (
                            <Link href={`/assessments/${cycleId}/${emp.id}/review`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-brand-dark hover:bg-brand-50"
                                title="รีวิว"
                              >
                                <FileEdit className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Link href={`/assessments/${cycleId}/${emp.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-brand-dark hover:bg-brand-50"
                              title="ดูรายละเอียด"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Grade Legend */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-title">เกณฑ์เกรด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {[
                  { grade: "A", range: "90-100", className: "bg-brand-500 text-white" },
                  { grade: "B+", range: "80-89", className: "bg-brand-dark text-white" },
                  { grade: "B", range: "70-79", className: "bg-brand-100 text-brand-dark" },
                  { grade: "C+", range: "60-69", className: "bg-brown-200 text-brown-800" },
                  { grade: "C", range: "50-59", className: "bg-brown-300 text-brown-900" },
                  { grade: "D", range: "< 50", className: "bg-accent-brand-100 text-accent-brand-700" },
                ].map((item) => (
                  <div key={item.grade} className="flex items-center gap-2">
                    <Badge className={`${item.className} hover:${item.className}`}>
                      {item.grade}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{item.range}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}
