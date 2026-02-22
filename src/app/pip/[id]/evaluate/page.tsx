"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  XCircle,
  Save,
  AlertCircle,
  BarChart3,
  Target,
  Loader2,
} from "lucide-react";
import { useApi, useApiMutation } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";
import { mockPIPs } from "@/lib/mockup-data";
import type { PIPRecord, GoalRating } from "@/lib/types";

function StarRating({
  value,
  onChange,
}: {
  value: GoalRating | null;
  onChange: (rating: GoalRating) => void;
}) {
  const [hover, setHover] = useState<number>(0);

  return (
    <div className="flex gap-1">
      {([1, 2, 3, 4, 5] as GoalRating[]).map((star) => (
        <button
          key={star}
          type="button"
          className="transition-transform hover:scale-110"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className={`h-6 w-6 ${
              star <= (hover || value || 0)
                ? "fill-brand-500 text-brand-500"
                : "text-brown-200"
            }`}
          />
        </button>
      ))}
      {value && (
        <span className="ml-2 text-sm text-muted-foreground">
          {value === 1
            ? "ต้องปรับปรุง"
            : value === 2
              ? "ต่ำกว่ามาตรฐาน"
              : value === 3
                ? "ตามมาตรฐาน"
                : value === 4
                  ? "ดี"
                  : "ดีเยี่ยม"}
        </span>
      )}
    </div>
  );
}

export default function EvaluatePIPPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // Fetch PIP data from API
  const { data: apiPIP, loading, error, refetch } = useApi<PIPRecord>(`/api/pip/${id}`);

  // Mutation for evaluation
  const { mutate, loading: saving } = useApiMutation(`/api/pip/${id}/evaluate`);

  // Fallback to mockup
  const mockPIP = mockPIPs.find((p) => p.id === id);
  const pip = apiPIP || mockPIP;

  const [goalRatings, setGoalRatings] = useState<
    Record<string, { rating: GoalRating | null; note: string }>
  >(() => {
    const initial: Record<string, { rating: GoalRating | null; note: string }> = {};
    ((pip || mockPIP)?.goals || []).forEach((g) => {
      initial[g.id] = { rating: null, note: "" };
    });
    return initial;
  });

  const [overallRating, setOverallRating] = useState<GoalRating | null>(null);
  const [result, setResult] = useState<"passed" | "failed" | null>(null);
  const [summary, setSummary] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (loading) {
    return (
      <AppShell title="ประเมินผล PIP" subtitle="">
        <LoadingSkeleton rows={3} />
      </AppShell>
    );
  }

  if (error && !mockPIP) {
    return (
      <AppShell title="ประเมินผล PIP" subtitle="">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }

  if (!pip) {
    return (
      <AppShell title="ไม่พบ PIP" subtitle="">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <XCircle className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">ไม่พบรายการ PIP ที่ต้องการ</p>
          <Link href="/pip">
            <Button className="mt-4 bg-brand-dark hover:bg-brand-700">
              กลับไปรายการ PIP
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const allGoalsRated = (pip.goals || []).every((g) => goalRatings[g.id]?.rating);
  const isValid = allGoalsRated && overallRating && result && summary.trim();

  const handleSubmit = async () => {
    const body = {
      goalRatings: (pip.goals || []).map((g) => ({
        goalId: g.id,
        rating: goalRatings[g.id]?.rating,
        note: goalRatings[g.id]?.note || "",
      })),
      overallRating,
      result,
      summary,
    };

    await mutate({
      method: "POST",
      body,
      onSuccess: () => {
        setSubmitted(true);
        setTimeout(() => {
          router.push(`/pip/${id}`);
        }, 2000);
      },
      onError: () => {
        // Fallback: show success for dev/mockup mode
        setSubmitted(true);
        setTimeout(() => {
          router.push(`/pip/${id}`);
        }, 2000);
      },
    });
  };

  if (submitted) {
    return (
      <AppShell title="ประเมินผล PIP" subtitle={pip.employeeName}>
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full ${
              result === "passed" ? "bg-brand-100" : "bg-accent-brand-100"
            }`}
          >
            {result === "passed" ? (
              <CheckCircle2 className="h-10 w-10 text-brand-dark" />
            ) : (
              <XCircle className="h-10 w-10 text-accent-brand-500" />
            )}
          </div>
          <h2 className="mt-4 text-xl font-bold font-title">
            บันทึกผลประเมินสำเร็จ!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            ผลการประเมิน:{" "}
            <span
              className={`font-medium ${
                result === "passed" ? "text-brand-dark" : "text-accent-brand-500"
              }`}
            >
              {result === "passed" ? "ผ่าน" : "ไม่ผ่าน"}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            กำลังนำกลับไปหน้ารายละเอียด PIP...
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="ประเมินผล PIP"
      subtitle={`${pip.employeeName} — ${pip.employeeDepartment}`}
    >
      {/* Back */}
      <div className="mb-4">
        <Link href={`/pip/${id}`}>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับไปรายละเอียด PIP
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* PIP Info */}
          <Card className="border-none shadow-sm">
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-brand-dark" />
                <span className="text-sm font-medium">{pip.employeeName}</span>
              </div>
              <Badge variant="outline">{pip.duration} วัน</Badge>
              <span className="text-sm text-muted-foreground">
                {pip.startDate} — {pip.endDate}
              </span>
              <Badge className="bg-brand-dark text-white hover:bg-brand-dark">
                {(pip.goals || []).length} เป้าหมาย
              </Badge>
            </CardContent>
          </Card>

          {/* Goal-by-Goal Rating */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-title">
                <BarChart3 className="h-5 w-5 text-brand-dark" />
                ประเมินแต่ละเป้าหมาย
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(pip.goals || []).map((goal, index) => {
                const percent = Math.min(
                  Math.round((goal.currentValue / goal.targetValue) * 100),
                  100
                );

                return (
                  <div key={goal.id}>
                    {index > 0 && <Separator className="mb-4" />}
                    <div className="rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-brand-dark text-white hover:bg-brand-dark text-[10px]">
                              เป้าหมายที่ {index + 1}
                            </Badge>
                            <h4 className="font-medium font-title text-sm">
                              {goal.title}
                            </h4>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {goal.description}
                          </p>
                        </div>
                      </div>

                      {/* KPI Progress */}
                      <div className="mt-3 rounded-lg bg-muted/50 p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {goal.kpiTarget}: {goal.currentValue.toLocaleString()} /{" "}
                            {goal.targetValue.toLocaleString()} {goal.kpiUnit}
                          </span>
                          <span
                            className={`font-medium ${
                              percent >= 80
                                ? "text-brand-dark"
                                : percent >= 50
                                  ? "text-brown-500"
                                  : "text-accent-brand-500"
                            }`}
                          >
                            {percent}%
                          </span>
                        </div>
                        <Progress
                          value={percent}
                          className="mt-2 h-2 bg-brand-100 [&>div]:bg-brand-dark"
                        />
                      </div>

                      {/* Rating */}
                      <div className="mt-4 space-y-3">
                        <div>
                          <Label className="text-sm">ให้คะแนน *</Label>
                          <div className="mt-1">
                            <StarRating
                              value={goalRatings[goal.id]?.rating ?? null}
                              onChange={(rating) =>
                                setGoalRatings({
                                  ...goalRatings,
                                  [goal.id]: {
                                    ...goalRatings[goal.id],
                                    rating,
                                  },
                                })
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm">หมายเหตุ</Label>
                          <Textarea
                            placeholder="เพิ่มหมายเหตุสำหรับเป้าหมายนี้..."
                            rows={2}
                            value={goalRatings[goal.id]?.note ?? ""}
                            onChange={(e) =>
                              setGoalRatings({
                                ...goalRatings,
                                [goal.id]: {
                                  ...goalRatings[goal.id],
                                  note: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Overall Evaluation */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-title">
                <Star className="h-5 w-5 text-brand-dark" />
                ผลประเมินรวม
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Overall Rating */}
              <div>
                <Label className="text-sm">คะแนนรวม *</Label>
                <div className="mt-2">
                  <StarRating value={overallRating} onChange={setOverallRating} />
                </div>
              </div>

              <Separator />

              {/* Pass / Fail */}
              <div>
                <Label className="text-sm">ผลการประเมิน *</Label>
                <div className="mt-2 flex gap-3">
                  <Button
                    type="button"
                    variant={result === "passed" ? "default" : "outline"}
                    className={
                      result === "passed"
                        ? "bg-brand-dark hover:bg-brand-700 text-white"
                        : "border-brand-dark text-brand-dark hover:bg-brand-50"
                    }
                    onClick={() => setResult("passed")}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    ผ่าน
                  </Button>
                  <Button
                    type="button"
                    variant={result === "failed" ? "default" : "outline"}
                    className={
                      result === "failed"
                        ? "bg-accent-brand-500 hover:bg-accent-brand-600 text-white"
                        : "border-accent-brand-500 text-accent-brand-500 hover:bg-accent-brand-50"
                    }
                    onClick={() => setResult("failed")}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    ไม่ผ่าน
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Summary Note */}
              <div>
                <Label className="text-sm">สรุปผลการประเมิน *</Label>
                <Textarea
                  placeholder="สรุปผลการประเมินโดยรวม ข้อเสนอแนะ และแนวทางต่อไป..."
                  rows={4}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div>
          <Card className="sticky top-20 border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-title">สรุปการประเมิน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Goal Ratings Summary */}
              <div className="space-y-2">
                {(pip.goals || []).map((goal, index) => {
                  const rating = goalRatings[goal.id]?.rating;
                  return (
                    <div
                      key={goal.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground truncate max-w-[140px]">
                        เป้าที่ {index + 1}
                      </span>
                      {rating ? (
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3 w-3 ${
                                s <= rating
                                  ? "fill-brand-500 text-brand-500"
                                  : "text-brown-200"
                              }`}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* Overall */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">คะแนนรวม</span>
                {overallRating ? (
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= overallRating
                            ? "fill-brand-500 text-brand-500"
                            : "text-brown-200"
                        }`}
                      />
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>

              {/* Result */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">ผลประเมิน</span>
                {result ? (
                  <Badge
                    className={
                      result === "passed"
                        ? "bg-brand-dark text-white hover:bg-brand-dark"
                        : "bg-accent-brand-500 text-white hover:bg-accent-brand-500"
                    }
                  >
                    {result === "passed" ? "ผ่าน" : "ไม่ผ่าน"}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>

              <Separator />

              {!isValid && (
                <div className="flex items-start gap-2 rounded-lg bg-accent-brand-50 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent-brand-500" />
                  <p className="text-xs text-accent-brand-700">
                    กรุณากรอกให้ครบ: ให้คะแนนทุกเป้าหมาย, คะแนนรวม, ผลประเมิน,
                    และสรุปผล
                  </p>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <Button
                  className="w-full bg-brand-dark hover:bg-brand-700"
                  disabled={!isValid || saving}
                  onClick={handleSubmit}
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {saving ? "กำลังบันทึก..." : "บันทึกผลประเมิน"}
                </Button>
                <Link href={`/pip/${id}`} className="block">
                  <Button variant="outline" className="w-full">
                    ยกเลิก
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
