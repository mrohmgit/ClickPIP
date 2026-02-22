"use client";

import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Target,
  Clock,
  TrendingUp,
  MessageSquare,
  ClipboardCheck,
  Send,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Star,
  FileText,
  Loader2,
} from "lucide-react";
import { useApi, useApiMutation } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";
import { mockPIPs, mockCheckIns, mockComments, mockUsers } from "@/lib/mockup-data";
import type { PIPRecord, CheckIn, Comment, GoalRating } from "@/lib/types";

// Simulate employee view — employee u3 (สมชาย)
const fallbackEmployeeUser = mockUsers.find((u) => u.id === "u3")!;

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "กำลังดำเนินการ", className: "bg-brand-dark text-white hover:bg-brand-dark" },
  completed: { label: "สำเร็จ", className: "bg-brand-500 text-white hover:bg-brand-500" },
  failed: { label: "ไม่ผ่าน", className: "bg-accent-brand-500 text-white hover:bg-accent-brand-500" },
  pending: { label: "รอดำเนินการ", className: "bg-brown-200 text-brown-800 hover:bg-brown-200" },
  extended: { label: "ขยายเวลา", className: "border-brand-dark text-brand-dark" },
};

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date("2026-02-20");
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getTimeProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date("2026-02-20");
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return Math.min(Math.round((elapsed / total) * 100), 100);
}

function RatingStars({ rating }: { rating: GoalRating | null }) {
  if (!rating) return <span className="text-xs text-muted-foreground">ยังไม่ประเมิน</span>;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${s <= rating ? "fill-brand-500 text-brand-500" : "text-brown-200"}`}
        />
      ))}
    </div>
  );
}

export default function MyPIPPage() {
  // Fetch current user's PIPs from API
  const { data: apiPIPs, loading, error, refetch } = useApi<PIPRecord[]>("/api/pip?employeeId=current");

  // Fallback to mockup
  const fallbackPIPs = mockPIPs.filter((p) => p.employeeId === fallbackEmployeeUser.id);
  const employeePIPs = apiPIPs && apiPIPs.length > 0 ? apiPIPs : fallbackPIPs;
  const employeeUser = fallbackEmployeeUser;

  const [selectedPIP, setSelectedPIP] = useState<PIPRecord | null>(null);

  // Auto-select first active PIP once data is loaded
  const currentPIP = selectedPIP || employeePIPs.find((p) => p.status === "active") || employeePIPs[0];

  const [newNote, setNewNote] = useState("");
  const [notes, setNotes] = useState<Comment[]>(
    mockComments.filter((c) => c.pipId === (currentPIP?.id || ""))
  );

  // Comment mutation
  const { mutate: postNote, loading: postingNote } = useApiMutation(
    currentPIP ? `/api/pip/${currentPIP.id}/comments` : "/api/pip/comments"
  );

  if (loading) {
    return (
      <AppShell title="PIP ของฉัน" subtitle="แผนพัฒนาประสิทธิภาพ">
        <LoadingSkeleton rows={3} />
      </AppShell>
    );
  }

  if (error && fallbackPIPs.length === 0) {
    return (
      <AppShell title="PIP ของฉัน" subtitle="แผนพัฒนาประสิทธิภาพ">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }

  if (!currentPIP) {
    return (
      <AppShell title="PIP ของฉัน" subtitle="แผนพัฒนาประสิทธิภาพ">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-brand-500" />
          <h2 className="mt-4 text-lg font-bold font-title">ไม่มี PIP ที่กำลังดำเนินการ</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            คุณไม่มีแผนพัฒนาประสิทธิภาพในขณะนี้
          </p>
        </div>
      </AppShell>
    );
  }

  const checkIns: CheckIn[] = mockCheckIns.filter((ci) => ci.pipId === currentPIP.id);
  const daysLeft = getDaysRemaining(currentPIP.endDate);
  const timeProgress = getTimeProgress(currentPIP.startDate, currentPIP.endDate);
  const totalGoals = (currentPIP.goals || []).length;
  const avgProgress =
    totalGoals > 0
      ? Math.round(
          (currentPIP.goals || []).reduce(
            (sum, g) => sum + Math.min((g.currentValue / g.targetValue) * 100, 100),
            0
          ) / totalGoals
        )
      : 0;

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    const optimisticNote: Comment = {
      id: `n-${Date.now()}`,
      pipId: currentPIP.id,
      userId: employeeUser.id,
      userName: employeeUser.name,
      userRole: "employee",
      content: newNote,
      createdAt: new Date().toISOString(),
    };

    await postNote({
      method: "POST",
      body: { content: newNote },
      onSuccess: () => {
        setNotes([...notes, optimisticNote]);
        setNewNote("");
      },
      onError: () => {
        // Fallback: add locally
        setNotes([...notes, optimisticNote]);
        setNewNote("");
      },
    });
  };

  return (
    <AppShell title="PIP ของฉัน" subtitle="แผนพัฒนาประสิทธิภาพ">
      {/* Employee Header */}
      <Card className="mb-6 border-none shadow-sm">
        <CardContent className="flex items-center gap-4 p-5">
          <Avatar className="h-14 w-14 border-2 border-brand-200">
            <AvatarFallback className="bg-brand-100 text-brand-dark font-body text-lg">
              {employeeUser.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-lg font-bold font-title">{employeeUser.name}</h2>
            <p className="text-sm text-muted-foreground">
              {employeeUser.position} · {employeeUser.department}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">PIP ทั้งหมด:</span>
            {employeePIPs.length > 1 && (
              <div className="flex gap-1">
                {employeePIPs.map((pip) => (
                  <Button
                    key={pip.id}
                    variant={currentPIP.id === pip.id ? "default" : "outline"}
                    size="sm"
                    className={
                      currentPIP.id === pip.id
                        ? "bg-brand-dark hover:bg-brand-700"
                        : ""
                    }
                    onClick={() => {
                      setSelectedPIP(pip);
                      setNotes(mockComments.filter((c) => c.pipId === pip.id));
                    }}
                  >
                    {pip.duration} วัน
                    <Badge
                      className={`ml-1 text-[9px] ${statusConfig[pip.status].className}`}
                    >
                      {statusConfig[pip.status].label}
                    </Badge>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-brand-100 p-2">
                <Target className="h-4 w-4 text-brand-dark" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">สถานะ</p>
                <Badge className={`mt-0.5 ${statusConfig[currentPIP.status].className}`}>
                  {statusConfig[currentPIP.status].label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-brand-100 p-2">
                <Calendar className="h-4 w-4 text-brand-dark" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ระยะเวลา</p>
                <p className="text-sm font-bold font-title">
                  {currentPIP.duration} วัน
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {currentPIP.startDate} — {currentPIP.endDate}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div
                className={`rounded-lg p-2 ${
                  daysLeft <= 14 ? "bg-accent-brand-100" : "bg-brand-100"
                }`}
              >
                <Clock
                  className={`h-4 w-4 ${
                    daysLeft <= 14 ? "text-accent-brand-500" : "text-brand-dark"
                  }`}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">เหลืออีก</p>
                <p
                  className={`text-sm font-bold font-title ${
                    daysLeft <= 14 ? "text-accent-brand-500" : "text-brand-dark"
                  }`}
                >
                  {daysLeft > 0 ? `${daysLeft} วัน` : "ครบกำหนด"}
                </p>
                <Progress
                  value={timeProgress}
                  className="mt-1 h-1 w-20 bg-brand-100 [&>div]:bg-brand-dark"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-brand-100 p-2">
                <TrendingUp className="h-4 w-4 text-brand-dark" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ความคืบหน้า</p>
                <p className="text-sm font-bold font-title text-brand-dark">
                  {avgProgress}%
                </p>
                <Progress
                  value={avgProgress}
                  className="mt-1 h-1 w-20 bg-brand-100 [&>div]:bg-brand-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="goals" className="space-y-4">
        <TabsList className="bg-white">
          <TabsTrigger
            value="goals"
            className="data-[state=active]:bg-brand-dark data-[state=active]:text-white"
          >
            <Target className="mr-2 h-4 w-4" />
            เป้าหมายของฉัน
          </TabsTrigger>
          <TabsTrigger
            value="checkins"
            className="data-[state=active]:bg-brand-dark data-[state=active]:text-white"
          >
            <ClipboardCheck className="mr-2 h-4 w-4" />
            ประวัติ Check-in
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="data-[state=active]:bg-brand-dark data-[state=active]:text-white"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            บันทึก / ข้อความ
          </TabsTrigger>
        </TabsList>

        {/* Goals Tab */}
        <TabsContent value="goals">
          <div className="space-y-4">
            {/* Reason Card */}
            <Card className="border-none shadow-sm bg-amber-50/50">
              <CardContent className="flex items-start gap-3 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">เหตุผลที่เปิด PIP</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {currentPIP.reason}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Goals */}
            {(currentPIP.goals || []).map((goal, index) => {
              const percent = Math.min(
                Math.round((goal.currentValue / goal.targetValue) * 100),
                100
              );
              return (
                <Card key={goal.id} className="border-none shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-brand-dark text-white hover:bg-brand-dark text-[10px]">
                            เป้าหมายที่ {index + 1}
                          </Badge>
                          <h3 className="font-medium font-title">{goal.title}</h3>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {goal.description}
                        </p>
                      </div>
                      <RatingStars rating={goal.rating} />
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {goal.kpiTarget}
                        </span>
                        <span className="font-medium">
                          {goal.currentValue.toLocaleString()} /{" "}
                          {goal.targetValue.toLocaleString()} {goal.kpiUnit}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <Progress
                          value={percent}
                          className="h-3 flex-1 bg-brand-100 [&>div]:bg-brand-dark"
                        />
                        <span
                          className={`text-sm font-bold ${
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
                      {percent < 80 && (
                        <p className="mt-2 text-xs text-accent-brand-500">
                          ต้องเพิ่มอีก{" "}
                          {(goal.targetValue - goal.currentValue).toLocaleString()}{" "}
                          {goal.kpiUnit} เพื่อถึงเป้าหมาย
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {(currentPIP.goals || []).length === 0 && (
              <Card className="border-none shadow-sm">
                <CardContent className="flex flex-col items-center py-12">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 text-muted-foreground">
                    ยังไม่ได้กำหนดเป้าหมาย
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Check-ins Tab */}
        <TabsContent value="checkins">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-title">
                ประวัติ Check-in ({checkIns.length} ครั้ง)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checkIns.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">
                  ยังไม่มีการ Check-in
                </p>
              ) : (
                <div className="space-y-4">
                  {[...checkIns].reverse().map((ci) => (
                    <div key={ci.id} className="rounded-lg border p-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-brand-dark text-white hover:bg-brand-dark">
                          สัปดาห์ที่ {ci.weekNumber}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {ci.date}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-lg bg-brand-50 p-3">
                          <p className="text-xs font-medium text-brand-dark">
                            หัวหน้าบันทึก
                          </p>
                          <p className="mt-1 text-sm">{ci.managerNote}</p>
                        </div>
                        <div className="rounded-lg bg-brown-50 p-3">
                          <p className="text-xs font-medium text-brown-600">
                            ฉันบันทึก
                          </p>
                          <p className="mt-1 text-sm">{ci.employeeNote}</p>
                        </div>
                      </div>

                      {ci.goalUpdates.length > 0 && (
                        <div className="mt-3">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">เป้าหมาย</TableHead>
                                <TableHead className="text-xs">ก่อน</TableHead>
                                <TableHead className="text-xs">หลัง</TableHead>
                                <TableHead className="text-xs">เปลี่ยนแปลง</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {ci.goalUpdates.map((gu) => {
                                const goal = (currentPIP.goals || []).find(
                                  (g) => g.id === gu.goalId
                                );
                                const change = gu.currentValue - gu.previousValue;
                                return (
                                  <TableRow key={gu.goalId}>
                                    <TableCell className="text-sm">
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

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-title">
                บันทึก / ข้อความ ({notes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notes.map((note) => {
                  const initials = note.userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("");
                  const isMe = note.userId === employeeUser.id;
                  const roleLabels: Record<string, string> = {
                    admin: "HR",
                    manager: "หัวหน้า",
                    employee: "ฉัน",
                    super_admin: "Admin",
                  };

                  return (
                    <div
                      key={note.id}
                      className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback
                          className={`text-[10px] text-white font-body ${
                            isMe ? "bg-brown-400" : "bg-brand-dark"
                          }`}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isMe ? "bg-brand-50 text-right" : "bg-muted"
                        }`}
                      >
                        <div
                          className={`flex items-center gap-2 ${
                            isMe ? "justify-end" : ""
                          }`}
                        >
                          <span className="text-xs font-medium">
                            {roleLabels[note.userRole]}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {note.createdAt.replace("T", " ").slice(0, 16)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{note.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Note */}
              <div className="mt-6 flex gap-3">
                <div className="flex-1">
                  <Textarea
                    placeholder="เขียนบันทึกหรือข้อความถึงหัวหน้า..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      className="bg-brand-dark hover:bg-brand-700"
                      disabled={!newNote.trim() || postingNote}
                      onClick={handleAddNote}
                    >
                      {postingNote ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      ส่งข้อความ
                    </Button>
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
