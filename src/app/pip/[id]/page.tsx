"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
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
  Target,
  User,
  Calendar,
  Clock,
  MessageSquare,
  ClipboardCheck,
  TrendingUp,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  BarChart3,
  Loader2,
} from "lucide-react";
import { useApi, useApiMutation } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";
import { mockPIPs, mockCheckIns, mockComments } from "@/lib/mockup-data";
import type { PIPRecord, PIPGoal, GoalRating, CheckIn, Comment } from "@/lib/types";

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "กำลังดำเนินการ", className: "bg-brand-dark text-white hover:bg-brand-dark" },
  completed: { label: "สำเร็จ", className: "bg-brand-500 text-white hover:bg-brand-500" },
  failed: { label: "ไม่ผ่าน", className: "bg-accent-brand-500 text-white hover:bg-accent-brand-500" },
  pending: { label: "รอดำเนินการ", className: "bg-brown-200 text-brown-800 hover:bg-brown-200" },
  extended: { label: "ขยายเวลา", className: "border-brand-dark text-brand-dark" },
};

const goalStatusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: "รอเริ่ม", className: "bg-brown-100 text-brown-700", icon: Clock },
  in_progress: { label: "กำลังดำเนินการ", className: "bg-brand-100 text-brand-dark", icon: TrendingUp },
  achieved: { label: "สำเร็จ", className: "bg-brand-500 text-white", icon: CheckCircle2 },
  not_achieved: { label: "ไม่สำเร็จ", className: "bg-accent-brand-100 text-accent-brand-700", icon: XCircle },
};

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date("2026-02-20");
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getDaysElapsed(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date("2026-02-20");
  return Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function getTimeProgress(startDate: string, endDate: string): number {
  const elapsed = getDaysElapsed(startDate);
  const total = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.min(Math.round((elapsed / total) * 100), 100);
}

function RatingStars({ rating }: { rating: GoalRating | null }) {
  if (!rating) return <span className="text-xs text-muted-foreground">ยังไม่ประเมิน</span>;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-sm ${star <= rating ? "text-brand-500" : "text-brown-200"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function GoalProgressCard({ goal }: { goal: PIPGoal }) {
  const percent = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
  const config = goalStatusConfig[goal.status];
  const StatusIcon = config.icon;

  return (
    <Card className="border shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium font-title text-sm">{goal.title}</h4>
              <Badge className={`text-[10px] ${config.className} hover:${config.className}`}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {config.label}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{goal.description}</p>
          </div>
          <RatingStars rating={goal.rating} />
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {goal.kpiTarget}: {goal.currentValue} / {goal.targetValue} {goal.kpiUnit}
            </span>
            <span className="font-medium text-brand-dark">{percent}%</span>
          </div>
          <Progress value={percent} className="h-2 bg-brand-100 [&>div]:bg-brand-dark" />
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineItem({
  date,
  title,
  description,
  type,
}: {
  date: string;
  title: string;
  description: string;
  type: "start" | "checkin" | "comment" | "evaluation" | "end";
}) {
  const colors: Record<string, string> = {
    start: "bg-brand-dark",
    checkin: "bg-brand-500",
    comment: "bg-brown-400",
    evaluation: "bg-accent-brand-500",
    end: "bg-brand-700",
  };

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`h-3 w-3 rounded-full ${colors[type]}`} />
        <div className="w-px flex-1 bg-border" />
      </div>
      <div className="pb-6">
        <p className="text-[10px] text-muted-foreground">{date}</p>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function PIPDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [newComment, setNewComment] = useState("");

  // Fetch PIP detail from API
  const { data: apiPIP, loading, error, refetch } = useApi<PIPRecord>(`/api/pip/${id}`);

  // Comment mutation
  const { mutate: postComment, loading: postingComment } = useApiMutation(`/api/pip/${id}/comments`);

  // Fallback to mockup
  const mockPIP = mockPIPs.find((p) => p.id === id);
  const pip = apiPIP || mockPIP;

  // Check-ins and comments from API PIP data or fallback
  const checkIns: CheckIn[] = mockCheckIns.filter((ci) => ci.pipId === id);
  const [comments, setComments] = useState<Comment[]>(mockComments.filter((c) => c.pipId === id));

  if (loading) {
    return (
      <AppShell title="รายละเอียด PIP" subtitle="">
        <LoadingSkeleton rows={4} />
      </AppShell>
    );
  }

  if (error && !mockPIP) {
    return (
      <AppShell title="รายละเอียด PIP" subtitle="">
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
            <Button className="mt-4 bg-brand-dark hover:bg-brand-700">กลับไปรายการ PIP</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const daysLeft = getDaysRemaining(pip.endDate);
  const timeProgress = getTimeProgress(pip.startDate, pip.endDate);
  const totalGoals = (pip.goals || []).length;
  const avgProgress =
    totalGoals > 0
      ? Math.round(
          (pip.goals || []).reduce(
            (sum, g) => sum + Math.min((g.currentValue / g.targetValue) * 100, 100),
            0
          ) / totalGoals
        )
      : 0;

  const timelineEvents = [
    {
      date: pip.startDate,
      title: "เริ่มต้น PIP",
      description: `สร้างแผน PIP ระยะเวลา ${pip.duration} วัน`,
      type: "start" as const,
    },
    ...checkIns.map((ci) => ({
      date: ci.date,
      title: `Check-in สัปดาห์ที่ ${ci.weekNumber}`,
      description: ci.managerNote,
      type: "checkin" as const,
    })),
    ...comments.map((c) => ({
      date: c.createdAt.split("T")[0],
      title: `${c.userName} แสดงความคิดเห็น`,
      description: c.content,
      type: "comment" as const,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const optimisticComment: Comment = {
      id: `c-${Date.now()}`,
      pipId: id,
      userId: "u1",
      userName: "สมศรี จันทร์สว่าง",
      userRole: "admin",
      content: newComment,
      createdAt: new Date().toISOString(),
    };

    await postComment({
      method: "POST",
      body: { content: newComment },
      onSuccess: () => {
        setComments([...comments, optimisticComment]);
        setNewComment("");
      },
      onError: () => {
        // Fallback: add comment locally even if API fails
        setComments([...comments, optimisticComment]);
        setNewComment("");
      },
    });
  };

  return (
    <AppShell
      title={`PIP — ${pip.employeeName}`}
      subtitle={`${pip.employeeDepartment} · ${pip.employeePosition}`}
    >
      {/* Back + Actions */}
      <div className="mb-4 flex items-center justify-between">
        <Link href="/pip">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับไปรายการ PIP
          </Button>
        </Link>
        <div className="flex gap-2">
          {pip.status === "active" && (
            <>
              <Button variant="outline" size="sm">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                บันทึก Check-in
              </Button>
              <Link href={`/pip/${id}/evaluate`}>
                <Button size="sm" className="bg-brand-dark hover:bg-brand-700">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  ประเมินผล
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">สถานะ</p>
            <Badge className={`mt-1 ${statusConfig[pip.status].className}`}>
              {statusConfig[pip.status].label}
            </Badge>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">ระยะเวลา</p>
            <p className="mt-1 text-lg font-bold font-title">{pip.duration} วัน</p>
            <p className="text-[10px] text-muted-foreground">
              {pip.startDate} — {pip.endDate}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">เวลาที่เหลือ</p>
            <p className={`mt-1 text-lg font-bold font-title ${daysLeft <= 14 ? "text-accent-brand-500" : "text-brand-dark"}`}>
              {daysLeft > 0 ? `${daysLeft} วัน` : "ครบกำหนด"}
            </p>
            <Progress
              value={timeProgress}
              className="mt-1 h-1.5 bg-brand-100 [&>div]:bg-brand-dark"
            />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">ความคืบหน้าเป้าหมาย</p>
            <p className="mt-1 text-lg font-bold font-title text-brand-dark">{avgProgress}%</p>
            <Progress
              value={avgProgress}
              className="mt-1 h-1.5 bg-brand-100 [&>div]:bg-brand-500"
            />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Check-in</p>
            <p className="mt-1 text-lg font-bold font-title">{checkIns.length} ครั้ง</p>
            <p className="text-[10px] text-muted-foreground">
              {checkIns.length > 0 ? `ล่าสุด: ${checkIns[checkIns.length - 1].date}` : "ยังไม่มี"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-white">
          <TabsTrigger value="overview" className="data-[state=active]:bg-brand-dark data-[state=active]:text-white">
            <Target className="mr-2 h-4 w-4" />
            ภาพรวม
          </TabsTrigger>
          <TabsTrigger value="checkins" className="data-[state=active]:bg-brand-dark data-[state=active]:text-white">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Check-in ({checkIns.length})
          </TabsTrigger>
          <TabsTrigger value="comments" className="data-[state=active]:bg-brand-dark data-[state=active]:text-white">
            <MessageSquare className="mr-2 h-4 w-4" />
            ความคิดเห็น ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-brand-dark data-[state=active]:text-white">
            <Clock className="mr-2 h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
              {/* Reason */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base font-title">
                    <FileText className="h-4 w-4 text-brand-dark" />
                    เหตุผลในการเปิด PIP
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-foreground">{pip.reason}</p>
                </CardContent>
              </Card>

              {/* Goals */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base font-title">
                    <Target className="h-4 w-4 text-brand-dark" />
                    เป้าหมาย / KPI ({(pip.goals || []).length} เป้าหมาย)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(pip.goals || []).length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      ยังไม่ได้กำหนดเป้าหมาย
                    </p>
                  ) : (
                    (pip.goals || []).map((goal) => <GoalProgressCard key={goal.id} goal={goal} />)
                  )}
                </CardContent>
              </Card>

              {/* Result (if completed/failed) */}
              {pip.result && (
                <Card className={`border-none shadow-sm ${pip.result === "passed" ? "bg-brand-50" : "bg-accent-brand-50"}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base font-title">
                      {pip.result === "passed" ? (
                        <CheckCircle2 className="h-5 w-5 text-brand-dark" />
                      ) : (
                        <XCircle className="h-5 w-5 text-accent-brand-500" />
                      )}
                      ผลการประเมิน: {pip.result === "passed" ? "ผ่าน" : "ไม่ผ่าน"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">คะแนนรวม:</span>
                      <RatingStars rating={pip.overallRating} />
                    </div>
                    {pip.resultNote && (
                      <p className="mt-2 text-sm">{pip.resultNote}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Info Sidebar */}
            <div className="space-y-4">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base font-title">
                    <User className="h-4 w-4 text-brand-dark" />
                    ข้อมูลพนักงาน
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-brand-200">
                      <AvatarFallback className="bg-brand-100 text-brand-dark font-body text-sm">
                        {pip.employeeName.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{pip.employeeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {pip.employeePosition}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pip.employeeDepartment}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">หัวหน้า</span>
                      <span className="font-medium">{pip.managerName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">สร้างเมื่อ</span>
                      <span>{pip.createdAt}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">อัปเดตล่าสุด</span>
                      <span>{pip.updatedAt}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-title">สรุปเป้าหมาย</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(goalStatusConfig).map(([key, config]) => {
                      const count = (pip.goals || []).filter((g) => g.status === key).length;
                      if (count === 0) return null;
                      const StatusIcon = config.icon;
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{config.label}</span>
                          </div>
                          <Badge className={`${config.className} hover:${config.className} text-[10px]`}>
                            {count}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Check-ins Tab */}
        <TabsContent value="checkins">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-title">
                ประวัติการ Check-in ({checkIns.length} ครั้ง)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checkIns.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">ยังไม่มีการ Check-in</p>
              ) : (
                <div className="space-y-4">
                  {[...checkIns].reverse().map((ci) => (
                    <div key={ci.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-brand-dark text-white hover:bg-brand-dark">
                            สัปดาห์ที่ {ci.weekNumber}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{ci.date}</span>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-lg bg-brand-50 p-3">
                          <p className="text-xs font-medium text-brand-dark">บันทึกจากหัวหน้า</p>
                          <p className="mt-1 text-sm">{ci.managerNote}</p>
                        </div>
                        <div className="rounded-lg bg-brown-50 p-3">
                          <p className="text-xs font-medium text-brown-600">บันทึกจากพนักงาน</p>
                          <p className="mt-1 text-sm">{ci.employeeNote}</p>
                        </div>
                      </div>

                      {ci.goalUpdates.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-2 text-xs font-medium text-muted-foreground">
                            ความคืบหน้าเป้าหมาย
                          </p>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">เป้าหมาย</TableHead>
                                <TableHead className="text-xs">ก่อน</TableHead>
                                <TableHead className="text-xs">หลัง</TableHead>
                                <TableHead className="text-xs">เปลี่ยนแปลง</TableHead>
                                <TableHead className="text-xs">หมายเหตุ</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {ci.goalUpdates.map((gu) => {
                                const goal = (pip.goals || []).find((g) => g.id === gu.goalId);
                                const change = gu.currentValue - gu.previousValue;
                                return (
                                  <TableRow key={gu.goalId}>
                                    <TableCell className="text-sm font-medium">
                                      {goal?.title || gu.goalId}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {gu.previousValue.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {gu.currentValue.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        className={
                                          change > 0
                                            ? "bg-brand-100 text-brand-dark hover:bg-brand-100"
                                            : "bg-accent-brand-100 text-accent-brand-700 hover:bg-accent-brand-100"
                                        }
                                      >
                                        {change > 0 ? "+" : ""}
                                        {change.toLocaleString()}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {gu.note}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-title">
                ความคิดเห็น ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Comment List */}
              <div className="space-y-4">
                {comments.map((comment) => {
                  const initials = comment.userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("");
                  const roleColors: Record<string, string> = {
                    admin: "bg-brand-dark",
                    manager: "bg-brand-500",
                    employee: "bg-brown-400",
                    super_admin: "bg-brand-700",
                  };
                  const roleLabels: Record<string, string> = {
                    admin: "HR",
                    manager: "หัวหน้า",
                    employee: "พนักงาน",
                    super_admin: "Admin",
                  };

                  return (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback
                          className={`${roleColors[comment.userRole]} text-[10px] text-white font-body`}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 rounded-lg border bg-white p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{comment.userName}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {roleLabels[comment.userRole]}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {comment.createdAt.replace("T", " ").slice(0, 16)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{comment.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Comment */}
              <div className="mt-6 flex gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-brand-dark text-[10px] text-white font-body">
                    สจ
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="เขียนความคิดเห็น..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      className="bg-brand-dark hover:bg-brand-700"
                      disabled={!newComment.trim() || postingComment}
                      onClick={handleAddComment}
                    >
                      {postingComment ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      ส่งความคิดเห็น
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-title">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="ml-2">
                {timelineEvents.map((event, index) => (
                  <TimelineItem
                    key={index}
                    date={event.date}
                    title={event.title}
                    description={event.description}
                    type={event.type}
                  />
                ))}
                {/* End marker */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full ${pip.status === "active" ? "border-2 border-brand-dark bg-white" : "bg-brand-700"}`} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{pip.endDate}</p>
                    <p className="text-sm font-medium">
                      {pip.status === "active"
                        ? `สิ้นสุด PIP (เหลือ ${daysLeft} วัน)`
                        : pip.result === "passed"
                          ? "สิ้นสุด PIP — ผ่าน"
                          : "สิ้นสุด PIP — ไม่ผ่าน"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
