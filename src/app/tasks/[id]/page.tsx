"use client";

import { use, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  User,
  Calendar,
  Flag,
  Clock,
  MessageSquare,
  Send,
  Star,
  Play,
  Eye,
  CheckCircle2,
  XCircle,
  Building2,
} from "lucide-react";
import { useApi, useApiMutation } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";

// ── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = "todo" | "in_progress" | "review" | "done" | "cancelled";
type TaskPriority = "urgent" | "high" | "medium" | "low";

interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  assignerId: string;
  assignerName: string;
  department: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  qualityRating: number | null;
  createdAt: string;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  role: string;
  content: string;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  type: "created" | "status_change" | "comment" | "rating";
  description: string;
  userName: string;
  date: string;
}

interface TaskDetailResponse {
  task: Task;
  comments: Comment[];
  activities: ActivityItem[];
}

// ── Fallback Mockup Data (dev without DB) ────────────────────────────────────

const mockTasks: Task[] = [
  {
    id: "t1",
    title: "จัดทำรายงานยอดขายประจำเดือน",
    description: "รวบรวมข้อมูลยอดขายจากทุกสาขาและจัดทำรายงานสรุปเพื่อนำเสนอในที่ประชุมผู้บริหาร รวมถึงวิเคราะห์แนวโน้มเทียบกับเดือนก่อนหน้า",
    assigneeId: "u3",
    assigneeName: "สมชาย มั่นคง",
    assignerId: "u2",
    assignerName: "วิภา แสงดาว",
    department: "ฝ่ายขาย",
    priority: "high",
    status: "in_progress",
    dueDate: "2026-02-25",
    qualityRating: null,
    createdAt: "2026-02-10",
  },
  {
    id: "t2",
    title: "อัปเดตข้อมูลลูกค้าในระบบ CRM",
    description: "ตรวจสอบและอัปเดตข้อมูลลูกค้ารายใหญ่ 50 ราย ให้ถูกต้องและเป็นปัจจุบัน",
    assigneeId: "u4",
    assigneeName: "สุดา เจริญสุข",
    assignerId: "u2",
    assignerName: "วิภา แสงดาว",
    department: "ฝ่ายขาย",
    priority: "medium",
    status: "todo",
    dueDate: "2026-02-28",
    qualityRating: null,
    createdAt: "2026-02-12",
  },
  {
    id: "t3",
    title: "เตรียมเอกสารประชุมผู้ถือหุ้น",
    description: "จัดเตรียมเอกสารนำเสนอผลประกอบการไตรมาส 4 รวมถึงกราฟและตาราง",
    assigneeId: "u5",
    assigneeName: "ประเสริฐ ก้าวหน้า",
    assignerId: "u1",
    assignerName: "สมศรี จันทร์สว่าง",
    department: "ฝ่ายบัญชีและการเงิน",
    priority: "urgent",
    status: "review",
    dueDate: "2026-02-23",
    qualityRating: 4,
    createdAt: "2026-02-05",
  },
  {
    id: "t4",
    title: "ตรวจสอบสต็อกสินค้าคงเหลือ",
    description: "ตรวจนับสินค้าคงเหลือและเทียบกับระบบ",
    assigneeId: "u3",
    assigneeName: "สมชาย มั่นคง",
    assignerId: "u2",
    assignerName: "วิภา แสงดาว",
    department: "ฝ่ายขาย",
    priority: "low",
    status: "done",
    dueDate: "2026-02-18",
    qualityRating: 5,
    createdAt: "2026-02-01",
  },
  {
    id: "t5",
    title: "จัดอบรมพนักงานใหม่ 5 คน",
    description: "อบรมการใช้ระบบภายในและนโยบายบริษัท",
    assigneeId: "u1",
    assigneeName: "สมศรี จันทร์สว่าง",
    assignerId: "u1",
    assignerName: "สมศรี จันทร์สว่าง",
    department: "ฝ่ายทรัพยากรบุคคล",
    priority: "high",
    status: "in_progress",
    dueDate: "2026-02-27",
    qualityRating: null,
    createdAt: "2026-02-14",
  },
  {
    id: "t6",
    title: "แก้ไขบั๊กหน้าสั่งซื้อสินค้า",
    description: "ผู้ใช้รายงานว่าไม่สามารถเลือกวิธีจัดส่งได้",
    assigneeId: "u6",
    assigneeName: "นิรุตต์ โค้ดดี",
    assignerId: "u2",
    assignerName: "วิภา แสงดาว",
    department: "ฝ่ายเทคโนโลยี",
    priority: "urgent",
    status: "in_progress",
    dueDate: "2026-02-22",
    qualityRating: null,
    createdAt: "2026-02-20",
  },
];

const mockCommentsData: Record<string, Comment[]> = {
  t1: [
    { id: "c1", userId: "u2", userName: "วิภา แสงดาว", role: "หัวหน้า", content: "ช่วยรวมข้อมูลสาขาภาคเหนือให้ด้วยนะคะ", createdAt: "2026-02-11 09:30" },
    { id: "c2", userId: "u3", userName: "สมชาย มั่นคง", role: "พนักงาน", content: "รับทราบครับ จะรวมข้อมูลทุกสาขาให้ครบ", createdAt: "2026-02-11 10:15" },
    { id: "c3", userId: "u2", userName: "วิภา แสงดาว", role: "หัวหน้า", content: "ดีมาก ถ้ามีปัญหาเรื่องข้อมูลบอกได้เลยนะ", createdAt: "2026-02-12 14:00" },
  ],
  t3: [
    { id: "c4", userId: "u1", userName: "สมศรี จันทร์สว่าง", role: "HR", content: "เอกสารเสร็จแล้วรบกวนส่งให้ตรวจก่อน 1 วันค่ะ", createdAt: "2026-02-06 08:00" },
    { id: "c5", userId: "u5", userName: "ประเสริฐ ก้าวหน้า", role: "พนักงาน", content: "ส่งให้ตรวจแล้วครับ รอ feedback", createdAt: "2026-02-21 16:30" },
  ],
  t6: [
    { id: "c6", userId: "u2", userName: "วิภา แสงดาว", role: "หัวหน้า", content: "งานนี้ด่วนมาก ลูกค้าสั่งซื้อไม่ได้", createdAt: "2026-02-20 10:00" },
  ],
};

const mockActivities: Record<string, ActivityItem[]> = {
  t1: [
    { id: "a1", type: "created", description: "สร้างงานใหม่", userName: "วิภา แสงดาว", date: "2026-02-10 08:00" },
    { id: "a2", type: "status_change", description: "เปลี่ยนสถานะเป็น กำลังทำ", userName: "สมชาย มั่นคง", date: "2026-02-10 09:00" },
    { id: "a3", type: "comment", description: "แสดงความคิดเห็น", userName: "วิภา แสงดาว", date: "2026-02-11 09:30" },
    { id: "a4", type: "comment", description: "แสดงความคิดเห็น", userName: "สมชาย มั่นคง", date: "2026-02-11 10:15" },
  ],
  t3: [
    { id: "a5", type: "created", description: "สร้างงานใหม่", userName: "สมศรี จันทร์สว่าง", date: "2026-02-05 10:00" },
    { id: "a6", type: "status_change", description: "เปลี่ยนสถานะเป็น กำลังทำ", userName: "ประเสริฐ ก้าวหน้า", date: "2026-02-06 08:30" },
    { id: "a7", type: "status_change", description: "เปลี่ยนสถานะเป็น รอตรวจสอบ", userName: "ประเสริฐ ก้าวหน้า", date: "2026-02-21 16:00" },
    { id: "a8", type: "rating", description: "ให้คะแนนคุณภาพ 4/5", userName: "สมศรี จันทร์สว่าง", date: "2026-02-22 09:00" },
  ],
  t4: [
    { id: "a9", type: "created", description: "สร้างงานใหม่", userName: "วิภา แสงดาว", date: "2026-02-01 08:00" },
    { id: "a10", type: "status_change", description: "เปลี่ยนสถานะเป็น กำลังทำ", userName: "สมชาย มั่นคง", date: "2026-02-02 09:00" },
    { id: "a11", type: "status_change", description: "เปลี่ยนสถานะเป็น เสร็จสิ้น", userName: "สมชาย มั่นคง", date: "2026-02-17 14:00" },
    { id: "a12", type: "rating", description: "ให้คะแนนคุณภาพ 5/5", userName: "วิภา แสงดาว", date: "2026-02-17 16:00" },
  ],
};

// ── Config ───────────────────────────────────────────────────────────────────

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  urgent: { label: "เร่งด่วน", className: "bg-accent-brand-500 text-white hover:bg-accent-brand-500" },
  high: { label: "สูง", className: "bg-accent-brand-100 text-accent-brand-700 hover:bg-accent-brand-100" },
  medium: { label: "ปานกลาง", className: "bg-brand-100 text-brand-dark hover:bg-brand-100" },
  low: { label: "ต่ำ", className: "bg-brown-100 text-brown-700 hover:bg-brown-100" },
};

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  todo: { label: "รอดำเนินการ", className: "bg-brown-200 text-brown-800 hover:bg-brown-200" },
  in_progress: { label: "กำลังทำ", className: "bg-brand-dark text-white hover:bg-brand-dark" },
  review: { label: "รอตรวจสอบ", className: "bg-brand-100 text-brand-dark hover:bg-brand-100" },
  done: { label: "เสร็จสิ้น", className: "bg-brand-500 text-white hover:bg-brand-500" },
  cancelled: { label: "ยกเลิก", className: "bg-brown-400 text-white hover:bg-brown-400" },
};

const statusTransitions: Record<TaskStatus, { key: TaskStatus; label: string; icon: React.ElementType }[]> = {
  todo: [
    { key: "in_progress", label: "เริ่มทำ", icon: Play },
    { key: "cancelled", label: "ยกเลิก", icon: XCircle },
  ],
  in_progress: [
    { key: "review", label: "ส่งตรวจ", icon: Eye },
    { key: "cancelled", label: "ยกเลิก", icon: XCircle },
  ],
  review: [
    { key: "in_progress", label: "ส่งกลับแก้ไข", icon: Play },
    { key: "done", label: "อนุมัติ/เสร็จสิ้น", icon: CheckCircle2 },
  ],
  done: [],
  cancelled: [],
};

const activityColors: Record<string, string> = {
  created: "bg-brand-dark",
  status_change: "bg-brand-500",
  comment: "bg-brown-400",
  rating: "bg-accent-brand-500",
};

// ── Sub-components ───────────────────────────────────────────────────────────

function QualityRating({
  rating,
  onRate,
  editable,
}: {
  rating: number | null;
  onRate: (r: number) => void;
  editable: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? rating ?? 0;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          disabled={!editable}
          className={`transition-colors ${editable ? "cursor-pointer" : "cursor-default"}`}
          onMouseEnter={() => editable && setHovered(s)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => editable && onRate(s)}
        >
          <Star
            className={`h-6 w-6 ${
              s <= display
                ? "fill-brand-500 text-brand-500"
                : "text-brown-200"
            }`}
          />
        </button>
      ))}
      {rating && (
        <span className="ml-2 text-sm font-medium text-brand-dark">{rating}/5</span>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // Fetch task detail from API
  const { data, loading, error, refetch } = useApi<TaskDetailResponse>(`/api/tasks/${id}`);

  // Mutations
  const { mutate: mutateTask, loading: savingStatus } = useApiMutation(`/api/tasks/${id}`);
  const { mutate: mutateComment, loading: savingComment } = useApiMutation(`/api/tasks/${id}/comments`);

  // Fallback to mockup data if API returns nothing
  const mockTask = mockTasks.find((t) => t.id === id) ?? null;
  const task = data?.task ?? mockTask;
  const initialComments = data?.comments ?? mockCommentsData[id] ?? [];
  const initialActivities = data?.activities ?? mockActivities[id] ?? (task ? [
    { id: "a-default", type: "created" as const, description: "สร้างงานใหม่", userName: task.assignerName, date: task.createdAt },
  ] : []);

  // Local state for interactive UI
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const [qualityRating, setQualityRating] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [initialized, setInitialized] = useState(false);

  // Sync local state when API data arrives
  if (data && !initialized) {
    setStatus(data.task.status);
    setQualityRating(data.task.qualityRating);
    setComments(data.comments ?? []);
    setActivities(data.activities ?? []);
    setInitialized(true);
  } else if (!data && task && !initialized) {
    setStatus(task.status);
    setQualityRating(task.qualityRating);
    setInitialized(true);
  }

  const currentStatus = status ?? task?.status ?? "todo";

  // Loading state
  if (loading) {
    return (
      <AppShell title="กำลังโหลด..." subtitle="">
        <LoadingSkeleton rows={6} />
      </AppShell>
    );
  }

  // Error state
  if (error && !task) {
    return (
      <AppShell title="เกิดข้อผิดพลาด" subtitle="">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }

  // Not found
  if (!task) {
    return (
      <AppShell title="ไม่พบงาน" subtitle="">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <XCircle className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">ไม่พบรายการงานที่ต้องการ</p>
          <Link href="/tasks">
            <Button className="mt-4 bg-brand-dark hover:bg-brand-700">กลับไปบอร์ดงาน</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const isOverdue = currentStatus !== "done" && currentStatus !== "cancelled" && new Date(task.dueDate) < new Date("2026-02-22");
  const canRate = currentStatus === "review" || currentStatus === "done";

  const handleStatusChange = async (newStatus: TaskStatus) => {
    const previousStatus = currentStatus;
    setStatus(newStatus);

    const newActivity: ActivityItem = {
      id: `a-${Date.now()}`,
      type: "status_change",
      description: `เปลี่ยนสถานะเป็น ${statusConfig[newStatus].label}`,
      userName: "สมศรี จันทร์สว่าง",
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    setActivities([...activities, newActivity]);

    await mutateTask({
      method: "PATCH",
      body: { status: newStatus },
      onError: () => {
        // Revert on error (fallback for dev without DB)
        // Keep the optimistic update for dev experience
      },
    });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: `c-${Date.now()}`,
      userId: "u1",
      userName: "สมศรี จันทร์สว่าง",
      role: "HR",
      content: newComment,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };

    // Optimistic update
    setComments([...comments, comment]);
    setActivities([
      ...activities,
      {
        id: `a-${Date.now()}`,
        type: "comment",
        description: "แสดงความคิดเห็น",
        userName: "สมศรี จันทร์สว่าง",
        date: comment.createdAt,
      },
    ]);
    setNewComment("");

    await mutateComment({
      method: "POST",
      body: { content: newComment },
      onError: () => {
        // Keep optimistic update for dev without DB
      },
    });
  };

  const handleRate = async (r: number) => {
    setQualityRating(r);
    setActivities([
      ...activities,
      {
        id: `a-${Date.now()}`,
        type: "rating",
        description: `ให้คะแนนคุณภาพ ${r}/5`,
        userName: "สมศรี จันทร์สว่าง",
        date: new Date().toISOString().replace("T", " ").slice(0, 16),
      },
    ]);

    await mutateTask({
      method: "PATCH",
      body: { qualityRating: r },
      onError: () => {
        // Keep optimistic update for dev without DB
      },
    });
  };

  return (
    <AppShell
      title={task.title}
      subtitle={`${task.department} · มอบหมายโดย ${task.assignerName}`}
    >
      {/* Back */}
      <div className="mb-4">
        <Link href="/tasks">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับไปบอร์ดงาน
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 xl:col-span-2">
          {/* Task Info Card */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg font-title">{task.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge className={priorityConfig[task.priority].className}>
                    {priorityConfig[task.priority].label}
                  </Badge>
                  <Badge className={statusConfig[currentStatus].className}>
                    {statusConfig[currentStatus].label}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-foreground">{task.description}</p>

              <Separator />

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">ผู้รับผิดชอบ</p>
                    <p className="text-sm font-medium">{task.assigneeName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">ผู้มอบหมาย</p>
                    <p className="text-sm font-medium">{task.assignerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">แผนก</p>
                    <p className="text-sm font-medium">{task.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">ความสำคัญ</p>
                    <Badge className={`mt-0.5 ${priorityConfig[task.priority].className}`}>
                      {priorityConfig[task.priority].label}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">กำหนดส่ง</p>
                    <p className={`text-sm font-medium ${isOverdue ? "text-accent-brand-500" : ""}`}>
                      {task.dueDate}
                      {isOverdue && <span className="ml-1 text-xs">(เลยกำหนด)</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">สร้างเมื่อ</p>
                    <p className="text-sm font-medium">{task.createdAt}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Change */}
          {statusTransitions[currentStatus].length > 0 && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-title">เปลี่ยนสถานะ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {statusTransitions[currentStatus].map((transition) => {
                    const Icon = transition.icon;
                    const isDestructive = transition.key === "cancelled";
                    return (
                      <Button
                        key={transition.key}
                        variant={isDestructive ? "outline" : "default"}
                        size="sm"
                        disabled={savingStatus}
                        className={
                          isDestructive
                            ? "border-brown-400 text-brown-600 hover:bg-brown-50"
                            : "bg-brand-dark hover:bg-brand-700"
                        }
                        onClick={() => handleStatusChange(transition.key)}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {transition.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quality Rating */}
          {canRate && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-title">
                  <Star className="h-4 w-4 text-brand-500" />
                  คะแนนคุณภาพ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QualityRating
                  rating={qualityRating}
                  onRate={handleRate}
                  editable={true}
                />
                {!qualityRating && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    คลิกที่ดาวเพื่อให้คะแนนคุณภาพงาน
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-title">
                <MessageSquare className="h-4 w-4 text-brand-dark" />
                ความคิดเห็น ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comments.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    ยังไม่มีความคิดเห็น
                  </p>
                )}
                {comments.map((comment) => {
                  const initials = comment.userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("");
                  return (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-brand-dark text-[10px] text-white font-body">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 rounded-lg border bg-white p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{comment.userName}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {comment.role}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {comment.createdAt}
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
                      disabled={!newComment.trim() || savingComment}
                      onClick={handleAddComment}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {savingComment ? "กำลังส่ง..." : "ส่งความคิดเห็น"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Activity Timeline */}
        <div className="space-y-6">
          <Card className="sticky top-20 border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-title">
                <Clock className="h-4 w-4 text-brand-dark" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="ml-1">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-3 w-3 rounded-full ${activityColors[activity.type]}`} />
                      {index < activities.length - 1 && (
                        <div className="w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-5">
                      <p className="text-[10px] text-muted-foreground">{activity.date}</p>
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.userName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
