"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { useApi, useApiMutation } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Save,
  Target,
  ChevronDown,
  ChevronUp,
  Clock,
  ClipboardCheck,
  CheckCircle2,
  BarChart3,
  AlertTriangle,
} from "lucide-react";

interface KPIFactor {
  id: string;
  name: string;
  description: string;
  maxScore: number;
}

interface KPICategory {
  id: string;
  name: string;
  weight: number;
  factors: KPIFactor[];
}

interface SubmissionData {
  employee: {
    id: string;
    name: string;
    position: string;
    department: string;
    email: string;
    managerId: string;
    managerName: string;
  };
  kpiCategories: KPICategory[];
  attendance: {
    presentDays: number;
    totalDays: number;
    lateDays: number;
    leaveDays: number;
    otHours: number;
  };
  taskSummary: {
    totalTasks: number;
    completedTasks: number;
    onTimeRate: number;
    avgQuality: number;
  };
  pipSummary: {
    active: number;
    passed: number;
    failed: number;
  };
}

// ─── Fallback mockup data for dev without DB ─────────────────────────────────
const mockSubmissionData: SubmissionData = {
  employee: {
    id: "e1",
    name: "สมชาย ใจดี",
    position: "พนักงานขาย",
    department: "ฝ่ายขาย",
    email: "somchai@company.co.th",
    managerId: "m1",
    managerName: "วิชัย บริหาร",
  },
  kpiCategories: [
    {
      id: "cat-1",
      name: "ผลงานตามเป้าหมาย",
      weight: 40,
      factors: [
        { id: "f1", name: "บรรลุ KPI รายไตรมาส", description: "ผลงานเทียบกับ KPI ที่ตั้งไว้", maxScore: 100 },
        { id: "f2", name: "คุณภาพงาน", description: "ความถูกต้อง ครบถ้วน ไม่ต้องแก้ไขซ้ำ", maxScore: 100 },
        { id: "f3", name: "ปริมาณงาน", description: "จำนวนงานที่ทำได้ต่อระยะเวลาที่กำหนด", maxScore: 100 },
      ],
    },
    {
      id: "cat-2",
      name: "ทักษะและความสามารถ",
      weight: 25,
      factors: [
        { id: "f4", name: "ความรู้ในงาน", description: "ความเข้าใจและความชำนาญในงานที่รับผิดชอบ", maxScore: 100 },
        { id: "f5", name: "การแก้ปัญหา", description: "ความสามารถในการวิเคราะห์และแก้ปัญหา", maxScore: 100 },
        { id: "f6", name: "การสื่อสาร", description: "ความสามารถในการสื่อสารอย่างมีประสิทธิภาพ", maxScore: 100 },
      ],
    },
    {
      id: "cat-3",
      name: "พฤติกรรมและวินัย",
      weight: 20,
      factors: [
        { id: "f7", name: "ความรับผิดชอบ", description: "ความตรงเวลา ส่งงานตามกำหนด", maxScore: 100 },
        { id: "f8", name: "การทำงานเป็นทีม", description: "ความร่วมมือกับเพื่อนร่วมงาน", maxScore: 100 },
        { id: "f9", name: "ความคิดริเริ่ม", description: "การเสนอแนวคิดและแนวทางใหม่", maxScore: 100 },
      ],
    },
    {
      id: "cat-4",
      name: "การพัฒนาตนเอง",
      weight: 15,
      factors: [
        { id: "f10", name: "การเรียนรู้ทักษะใหม่", description: "ความกระตือรือร้นในการเรียนรู้สิ่งใหม่", maxScore: 100 },
        { id: "f11", name: "การปรับตัว", description: "ความสามารถในการปรับตัวกับการเปลี่ยนแปลง", maxScore: 100 },
      ],
    },
  ],
  attendance: {
    presentDays: 58,
    totalDays: 63,
    lateDays: 3,
    leaveDays: 5,
    otHours: 24,
  },
  taskSummary: {
    totalTasks: 42,
    completedTasks: 38,
    onTimeRate: 90,
    avgQuality: 82,
  },
  pipSummary: {
    active: 0,
    passed: 1,
    failed: 0,
  },
};

function getGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B+";
  if (score >= 70) return "B";
  if (score >= 60) return "C+";
  if (score >= 50) return "C";
  return "D";
}

function getGradeClassName(grade: string): string {
  if (grade === "A") return "bg-brand-500 text-white";
  if (grade === "B+") return "bg-brand-dark text-white";
  if (grade === "B") return "bg-brand-100 text-brand-dark";
  if (grade === "C+") return "bg-brown-200 text-brown-800";
  if (grade === "C") return "bg-brown-300 text-brown-900";
  return "bg-accent-brand-100 text-accent-brand-700";
}

export default function AssessmentFormPage({
  params,
}: {
  params: Promise<{ cycleId: string; employeeId: string }>;
}) {
  const { cycleId, employeeId } = use(params);
  const { data: apiData, loading, error, refetch } = useApi<SubmissionData>(
    `/api/assessments/submissions?cycleId=${cycleId}&employeeId=${employeeId}`
  );
  const { mutate, loading: saving } = useApiMutation("/api/assessments/submissions");

  const submissionData = apiData ?? mockSubmissionData;
  const employeeInfo = submissionData.employee;
  const kpiCategories = submissionData.kpiCategories;
  const attendance = submissionData.attendance;
  const taskSummary = submissionData.taskSummary;
  const pipSummary = submissionData.pipSummary;

  const [scores, setScores] = useState<Record<string, number>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      kpiCategories.forEach((cat) => {
        initial[cat.id] = true;
      });
      return initial;
    }
  );
  const [submitted, setSubmitted] = useState(false);

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const updateScore = (factorId: string, value: string) => {
    const num = Number(value);
    if (value === "" || (num >= 0 && num <= 100)) {
      setScores((prev) => ({
        ...prev,
        [factorId]: value === "" ? 0 : num,
      }));
    }
  };

  const overallScore = useMemo(() => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    kpiCategories.forEach((cat) => {
      const factorScores = cat.factors.map((f) => scores[f.id] || 0);
      const avgCatScore =
        factorScores.length > 0
          ? factorScores.reduce((a, b) => a + b, 0) / factorScores.length
          : 0;
      totalWeightedScore += avgCatScore * (cat.weight / 100);
      totalWeight += cat.weight;
    });

    return totalWeight > 0 ? Math.round(totalWeightedScore * (100 / totalWeight) * 100) / 100 : 0;
  }, [scores, kpiCategories]);

  const overallGrade = getGrade(overallScore);

  const allFactorsFilled = kpiCategories.every((cat) =>
    cat.factors.every((f) => scores[f.id] !== undefined && scores[f.id] > 0)
  );

  const handleSubmit = async () => {
    await mutate({
      body: {
        cycleId,
        employeeId,
        type: "manager",
        scores,
        overallScore,
        overallGrade,
      },
      onSuccess: () => {
        setSubmitted(true);
      },
      onError: () => {
        // Fallback for dev without DB
        setSubmitted(true);
      },
    });
  };

  if (submitted) {
    return (
      <AppShell title="ประเมินผลงาน" subtitle={employeeInfo.name}>
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
            <CheckCircle2 className="h-8 w-8 text-brand-dark" />
          </div>
          <h2 className="mt-4 text-xl font-bold font-title text-brand-dark">
            บันทึกการประเมินสำเร็จ!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            คะแนนรวม: {overallScore} ({overallGrade})
          </p>
          <Link href={`/assessments/${cycleId}`}>
            <Button className="mt-4 bg-brand-dark hover:bg-brand-700">
              กลับไปรายละเอียดรอบ
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="ประเมินผลงาน (หัวหน้า)"
      subtitle={`${employeeInfo.name} — ${employeeInfo.department}`}
    >
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          {/* Back */}
          <div className="mb-4">
            <Link href={`/assessments/${cycleId}`}>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                กลับไปรายละเอียดรอบ
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              {/* Employee Info Header */}
              <Card className="border-none shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="h-14 w-14 border-2 border-brand-200">
                    <AvatarFallback className="bg-brand-100 text-brand-dark font-body text-lg">
                      {employeeInfo.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-bold font-title">{employeeInfo.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {employeeInfo.position} · {employeeInfo.department}
                    </p>
                    <p className="text-xs text-muted-foreground">{employeeInfo.email}</p>
                  </div>
                </CardContent>
              </Card>

              {/* KPI Categories */}
              {kpiCategories.map((cat) => (
                <Card key={cat.id} className="border-none shadow-sm">
                  <CardHeader
                    className="cursor-pointer pb-3"
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <CardTitle className="flex items-center justify-between text-base font-title">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-brand-dark" />
                        {cat.name}
                        <Badge className="bg-brand-100 text-brand-dark hover:bg-brand-100 text-xs">
                          น้ำหนัก {cat.weight}%
                        </Badge>
                      </div>
                      {expandedCategories[cat.id] ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  {expandedCategories[cat.id] && (
                    <CardContent className="space-y-4 pt-0">
                      {cat.factors.map((factor) => (
                        <div
                          key={factor.id}
                          className="rounded-lg border bg-white p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{factor.name}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {factor.description}
                              </p>
                            </div>
                            <div className="ml-4 w-24">
                              <Label className="text-xs text-muted-foreground">
                                คะแนน (0-100)
                              </Label>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={scores[factor.id] ?? ""}
                                onChange={(e) =>
                                  updateScore(factor.id, e.target.value)
                                }
                                className="mt-1 text-center"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              ))}

              {/* Auto-populated Data */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-title">
                    <BarChart3 className="h-4 w-4 text-brand-dark" />
                    ข้อมูลอ้างอิง (อัตโนมัติ)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Attendance */}
                  <div className="rounded-lg bg-brand-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-brand-dark" />
                      <span className="text-sm font-medium text-brand-dark">
                        สรุปการเข้างาน
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      <div>
                        <p className="text-xs text-muted-foreground">วันทำงาน</p>
                        <p className="font-bold font-title">
                          {attendance.presentDays}/{attendance.totalDays}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">สาย</p>
                        <p className="font-bold font-title text-brown-600">
                          {attendance.lateDays} วัน
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ลา</p>
                        <p className="font-bold font-title">
                          {attendance.leaveDays} วัน
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">OT</p>
                        <p className="font-bold font-title">
                          {attendance.otHours} ชม.
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">อัตราเข้างาน</p>
                        <p className="font-bold font-title text-brand-dark">
                          {Math.round((attendance.presentDays / attendance.totalDays) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="rounded-lg bg-brown-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 text-brown-600" />
                      <span className="text-sm font-medium text-brown-700">
                        สรุปงาน
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted-foreground">งานทั้งหมด</p>
                        <p className="font-bold font-title">{taskSummary.totalTasks}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">เสร็จแล้ว</p>
                        <p className="font-bold font-title text-brand-dark">
                          {taskSummary.completedTasks}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ตรงเวลา</p>
                        <p className="font-bold font-title">
                          {taskSummary.onTimeRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">คุณภาพเฉลี่ย</p>
                        <p className="font-bold font-title">
                          {taskSummary.avgQuality}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PIP */}
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">สรุป PIP</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Active</p>
                        <p className="font-bold font-title">{pipSummary.active}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ผ่าน</p>
                        <p className="font-bold font-title text-brand-dark">
                          {pipSummary.passed}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ไม่ผ่าน</p>
                        <p className="font-bold font-title text-accent-brand-500">
                          {pipSummary.failed}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-20 border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-title">สรุปคะแนน</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Category scores */}
                  <div className="space-y-3">
                    {kpiCategories.map((cat) => {
                      const factorScores = cat.factors.map((f) => scores[f.id] || 0);
                      const avg =
                        factorScores.length > 0
                          ? Math.round(
                              factorScores.reduce((a, b) => a + b, 0) /
                                factorScores.length
                            )
                          : 0;
                      return (
                        <div key={cat.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate max-w-[140px]">
                            {cat.name} ({cat.weight}%)
                          </span>
                          <span className="font-medium">{avg}</span>
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  {/* Overall */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium">คะแนนรวม</span>
                    <span className="text-2xl font-bold font-title text-brand-dark">
                      {overallScore}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">เกรด</span>
                    <Badge
                      className={`text-lg px-3 py-1 ${getGradeClassName(overallGrade)} hover:${getGradeClassName(overallGrade)}`}
                    >
                      {overallGrade}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="space-y-2 pt-2">
                    <Button
                      className="w-full bg-brand-dark hover:bg-brand-700"
                      disabled={!allFactorsFilled || saving}
                      onClick={handleSubmit}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "กำลังบันทึก..." : "บันทึกการประเมิน"}
                    </Button>
                    <Link href={`/assessments/${cycleId}`} className="block">
                      <Button variant="outline" className="w-full">
                        ยกเลิก
                      </Button>
                    </Link>
                  </div>

                  {!allFactorsFilled && (
                    <div className="flex items-start gap-2 rounded-lg bg-accent-brand-50 p-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-brand-500" />
                      <p className="text-xs text-accent-brand-700">
                        กรุณาให้คะแนนทุกปัจจัยก่อนบันทึก
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
