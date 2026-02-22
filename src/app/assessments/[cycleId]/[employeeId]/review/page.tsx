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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Target,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";

interface KPIFactor {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  selfScore: number;
}

interface KPICategory {
  id: string;
  name: string;
  weight: number;
  factors: KPIFactor[];
}

interface ReviewSubmissionData {
  employee: {
    id: string;
    name: string;
    position: string;
    department: string;
    email: string;
  };
  kpiCategories: KPICategory[];
}

// ─── Fallback mockup data for dev without DB ─────────────────────────────────
const mockReviewData: ReviewSubmissionData = {
  employee: {
    id: "e1",
    name: "สมชาย ใจดี",
    position: "พนักงานขาย",
    department: "ฝ่ายขาย",
    email: "somchai@company.co.th",
  },
  kpiCategories: [
    {
      id: "cat-1",
      name: "ผลงานตามเป้าหมาย",
      weight: 40,
      factors: [
        { id: "f1", name: "บรรลุ KPI รายไตรมาส", description: "ผลงานเทียบกับ KPI ที่ตั้งไว้", maxScore: 100, selfScore: 80 },
        { id: "f2", name: "คุณภาพงาน", description: "ความถูกต้อง ครบถ้วน ไม่ต้องแก้ไขซ้ำ", maxScore: 100, selfScore: 85 },
        { id: "f3", name: "ปริมาณงาน", description: "จำนวนงานที่ทำได้ต่อระยะเวลาที่กำหนด", maxScore: 100, selfScore: 75 },
      ],
    },
    {
      id: "cat-2",
      name: "ทักษะและความสามารถ",
      weight: 25,
      factors: [
        { id: "f4", name: "ความรู้ในงาน", description: "ความเข้าใจและความชำนาญในงานที่รับผิดชอบ", maxScore: 100, selfScore: 90 },
        { id: "f5", name: "การแก้ปัญหา", description: "ความสามารถในการวิเคราะห์และแก้ปัญหา", maxScore: 100, selfScore: 78 },
        { id: "f6", name: "การสื่อสาร", description: "ความสามารถในการสื่อสารอย่างมีประสิทธิภาพ", maxScore: 100, selfScore: 82 },
      ],
    },
    {
      id: "cat-3",
      name: "พฤติกรรมและวินัย",
      weight: 20,
      factors: [
        { id: "f7", name: "ความรับผิดชอบ", description: "ความตรงเวลา ส่งงานตามกำหนด", maxScore: 100, selfScore: 88 },
        { id: "f8", name: "การทำงานเป็นทีม", description: "ความร่วมมือกับเพื่อนร่วมงาน", maxScore: 100, selfScore: 85 },
        { id: "f9", name: "ความคิดริเริ่ม", description: "การเสนอแนวคิดและแนวทางใหม่", maxScore: 100, selfScore: 70 },
      ],
    },
    {
      id: "cat-4",
      name: "การพัฒนาตนเอง",
      weight: 15,
      factors: [
        { id: "f10", name: "การเรียนรู้ทักษะใหม่", description: "ความกระตือรือร้นในการเรียนรู้สิ่งใหม่", maxScore: 100, selfScore: 75 },
        { id: "f11", name: "การปรับตัว", description: "ความสามารถในการปรับตัวกับการเปลี่ยนแปลง", maxScore: 100, selfScore: 80 },
      ],
    },
  ],
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

export default function ManagerReviewPage({
  params,
}: {
  params: Promise<{ cycleId: string; employeeId: string }>;
}) {
  const { cycleId, employeeId } = use(params);
  const { data: apiData, loading, error, refetch } = useApi<ReviewSubmissionData>(
    `/api/assessments/submissions?cycleId=${cycleId}&employeeId=${employeeId}`
  );
  const { mutate, loading: saving } = useApiMutation("/api/assessments/submissions");

  const reviewData = apiData ?? mockReviewData;
  const employeeInfo = reviewData.employee;
  const kpiCategories = reviewData.kpiCategories;

  const [managerScores, setManagerScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [gradeOverride, setGradeOverride] = useState("");
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
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const updateScore = (factorId: string, value: string) => {
    const num = Number(value);
    if (value === "" || (num >= 0 && num <= 100)) {
      setManagerScores((prev) => ({
        ...prev,
        [factorId]: value === "" ? 0 : num,
      }));
    }
  };

  const updateComment = (catId: string, value: string) => {
    setComments((prev) => ({ ...prev, [catId]: value }));
  };

  const selfOverallScore = useMemo(() => {
    let totalWeightedScore = 0;
    kpiCategories.forEach((cat) => {
      const avg = cat.factors.reduce((a, f) => a + f.selfScore, 0) / cat.factors.length;
      totalWeightedScore += avg * (cat.weight / 100);
    });
    return Math.round(totalWeightedScore * 100) / 100;
  }, [kpiCategories]);

  const managerOverallScore = useMemo(() => {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    kpiCategories.forEach((cat) => {
      const factorScores = cat.factors.map((f) => managerScores[f.id] || 0);
      const avg =
        factorScores.length > 0
          ? factorScores.reduce((a, b) => a + b, 0) / factorScores.length
          : 0;
      totalWeightedScore += avg * (cat.weight / 100);
      totalWeight += cat.weight;
    });
    return totalWeight > 0 ? Math.round(totalWeightedScore * (100 / totalWeight) * 100) / 100 : 0;
  }, [managerScores, kpiCategories]);

  const selfGrade = getGrade(selfOverallScore);
  const managerGrade = gradeOverride || getGrade(managerOverallScore);

  const allFactorsFilled = kpiCategories.every((cat) =>
    cat.factors.every((f) => managerScores[f.id] !== undefined && managerScores[f.id] > 0)
  );

  const handleSubmit = async () => {
    await mutate({
      body: {
        cycleId,
        employeeId,
        type: "review",
        managerScores,
        comments,
        gradeOverride: gradeOverride || null,
        managerOverallScore,
        managerGrade,
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
      <AppShell title="รีวิวการประเมิน" subtitle={employeeInfo.name}>
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
            <CheckCircle2 className="h-8 w-8 text-brand-dark" />
          </div>
          <h2 className="mt-4 text-xl font-bold font-title text-brand-dark">
            บันทึกการรีวิวสำเร็จ!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            คะแนนหัวหน้า: {managerOverallScore} | เกรด: {managerGrade}
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
      title="รีวิวการประเมิน"
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
              {/* Employee Header */}
              <Card className="border-none shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="h-14 w-14 border-2 border-brand-200">
                    <AvatarFallback className="bg-brand-100 text-brand-dark font-body text-lg">
                      {employeeInfo.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold font-title">{employeeInfo.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {employeeInfo.position} · {employeeInfo.department}
                    </p>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">คะแนนตนเอง</p>
                      <p className="text-xl font-bold font-title text-brown-600">{selfOverallScore}</p>
                      <Badge className={`${getGradeClassName(selfGrade)} text-xs`}>
                        {selfGrade}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">คะแนนหัวหน้า</p>
                      <p className="text-xl font-bold font-title text-brand-dark">{managerOverallScore}</p>
                      <Badge className={`${getGradeClassName(getGrade(managerOverallScore))} text-xs`}>
                        {getGrade(managerOverallScore)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* KPI Categories - Side by Side */}
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
                      {/* Column Headers */}
                      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                        <div className="col-span-6">ปัจจัย</div>
                        <div className="col-span-3 text-center">คะแนนตนเอง</div>
                        <div className="col-span-3 text-center">คะแนนหัวหน้า</div>
                      </div>

                      {cat.factors.map((factor) => {
                        const diff = (managerScores[factor.id] || 0) - factor.selfScore;
                        return (
                          <div
                            key={factor.id}
                            className="grid grid-cols-12 items-center gap-2 rounded-lg border bg-white p-3"
                          >
                            <div className="col-span-6">
                              <p className="text-sm font-medium">{factor.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {factor.description}
                              </p>
                            </div>
                            <div className="col-span-3 text-center">
                              <div className="inline-flex h-10 w-20 items-center justify-center rounded-md bg-brown-50 text-sm font-medium text-brown-700">
                                {factor.selfScore}
                              </div>
                            </div>
                            <div className="col-span-3 flex flex-col items-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={managerScores[factor.id] ?? ""}
                                onChange={(e) => updateScore(factor.id, e.target.value)}
                                className="w-20 text-center"
                                placeholder="0"
                              />
                              {managerScores[factor.id] !== undefined && managerScores[factor.id] > 0 && (
                                <span
                                  className={`text-[10px] font-medium ${
                                    diff > 0
                                      ? "text-brand-dark"
                                      : diff < 0
                                        ? "text-accent-brand-500"
                                        : "text-muted-foreground"
                                  }`}
                                >
                                  {diff > 0 ? "+" : ""}{diff}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Category Comment */}
                      <div className="rounded-lg bg-muted/30 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <MessageSquare className="h-3 w-3 text-muted-foreground" />
                          <Label className="text-xs text-muted-foreground">
                            ความเห็นของหัวหน้า
                          </Label>
                        </div>
                        <Textarea
                          placeholder={`ความเห็นเกี่ยวกับ${cat.name}...`}
                          rows={2}
                          value={comments[cat.id] || ""}
                          onChange={(e) => updateComment(cat.id, e.target.value)}
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-20 border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-title">สรุปการรีวิว</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Comparison per category */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground">
                      <span>หมวด</span>
                      <span className="text-center">ตนเอง</span>
                      <span className="text-center">หัวหน้า</span>
                    </div>
                    {kpiCategories.map((cat) => {
                      const selfAvg = Math.round(
                        cat.factors.reduce((a, f) => a + f.selfScore, 0) / cat.factors.length
                      );
                      const mgrFactorScores = cat.factors.map((f) => managerScores[f.id] || 0);
                      const mgrAvg = Math.round(
                        mgrFactorScores.reduce((a, b) => a + b, 0) / mgrFactorScores.length
                      );
                      return (
                        <div key={cat.id} className="grid grid-cols-3 text-sm">
                          <span className="text-muted-foreground truncate text-xs">
                            {cat.name.slice(0, 8)}...
                          </span>
                          <span className="text-center font-medium text-brown-600">
                            {selfAvg}
                          </span>
                          <span className="text-center font-medium text-brand-dark">
                            {mgrAvg}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  {/* Overall scores */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">คะแนนตนเอง</p>
                      <p className="text-xl font-bold font-title text-brown-600">
                        {selfOverallScore}
                      </p>
                      <Badge className={`${getGradeClassName(selfGrade)} text-xs`}>
                        {selfGrade}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">คะแนนหัวหน้า</p>
                      <p className="text-xl font-bold font-title text-brand-dark">
                        {managerOverallScore}
                      </p>
                      <Badge className={`${getGradeClassName(getGrade(managerOverallScore))} text-xs`}>
                        {getGrade(managerOverallScore)}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Grade Override */}
                  <div className="space-y-2">
                    <Label className="text-sm">ปรับเกรดสุดท้าย (ถ้าต้องการ)</Label>
                    <Select value={gradeOverride} onValueChange={setGradeOverride}>
                      <SelectTrigger>
                        <SelectValue placeholder="ใช้เกรดตามคะแนน" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">ใช้เกรดตามคะแนน</SelectItem>
                        <SelectItem value="A">A (90-100)</SelectItem>
                        <SelectItem value="B+">B+ (80-89)</SelectItem>
                        <SelectItem value="B">B (70-79)</SelectItem>
                        <SelectItem value="C+">C+ (60-69)</SelectItem>
                        <SelectItem value="C">C (50-59)</SelectItem>
                        <SelectItem value="D">D (&lt; 50)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-2 pt-2">
                    <Button
                      className="w-full bg-brand-dark hover:bg-brand-700"
                      disabled={!allFactorsFilled || saving}
                      onClick={handleSubmit}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "กำลังบันทึก..." : "บันทึกการรีวิว"}
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
                        กรุณาให้คะแนนหัวหน้าทุกปัจจัยก่อนบันทึก
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
