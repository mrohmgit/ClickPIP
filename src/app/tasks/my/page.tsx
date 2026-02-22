"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Calendar,
  Star,
} from "lucide-react";
import { useApi } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";

// ── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = "todo" | "in_progress" | "review" | "done" | "cancelled";
type TaskPriority = "urgent" | "high" | "medium" | "low";

interface Task {
  id: string;
  title: string;
  description: string;
  assignerName: string;
  department: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  qualityRating: number | null;
  createdAt: string;
  progressPercent: number;
}

interface MyTasksResponse {
  tasks: Task[];
  employee: {
    id: string;
    name: string;
    position: string;
    department: string;
  };
  stats: {
    total: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
}

// ── Fallback Mockup Data (dev without DB) ────────────────────────────────────

const fallbackEmployee = {
  id: "u3",
  name: "สมชาย มั่นคง",
  position: "พนักงานขาย",
  department: "ฝ่ายขาย",
};

const fallbackTasks: Task[] = [
  {
    id: "t1",
    title: "จัดทำรายงานยอดขายประจำเดือน",
    description: "รวบรวมข้อมูลยอดขายจากทุกสาขาและจัดทำรายงานสรุป",
    assignerName: "วิภา แสงดาว",
    department: "ฝ่ายขาย",
    priority: "high",
    status: "in_progress",
    dueDate: "2026-02-25",
    qualityRating: null,
    createdAt: "2026-02-10",
    progressPercent: 65,
  },
  {
    id: "t4",
    title: "ตรวจสอบสต็อกสินค้าคงเหลือ",
    description: "ตรวจนับสินค้าคงเหลือและเทียบกับระบบ",
    assignerName: "วิภา แสงดาว",
    department: "ฝ่ายขาย",
    priority: "low",
    status: "done",
    dueDate: "2026-02-18",
    qualityRating: 5,
    createdAt: "2026-02-01",
    progressPercent: 100,
  },
  {
    id: "t11",
    title: "ติดต่อลูกค้ารายใหม่ 10 ราย",
    description: "โทรแนะนำสินค้าให้ลูกค้ารายใหม่ตาม lead list",
    assignerName: "วิภา แสงดาว",
    department: "ฝ่ายขาย",
    priority: "medium",
    status: "todo",
    dueDate: "2026-02-26",
    qualityRating: null,
    createdAt: "2026-02-18",
    progressPercent: 0,
  },
  {
    id: "t12",
    title: "อัปเดตราคาสินค้าในระบบ",
    description: "ปรับราคาสินค้าตามรายการที่ได้รับจากฝ่ายจัดซื้อ",
    assignerName: "วิภา แสงดาว",
    department: "ฝ่ายขาย",
    priority: "urgent",
    status: "in_progress",
    dueDate: "2026-02-22",
    qualityRating: null,
    createdAt: "2026-02-20",
    progressPercent: 40,
  },
  {
    id: "t13",
    title: "จัดเตรียมของแถมโปรโมชั่น มี.ค.",
    description: "ประสานงานกับฝ่ายคลังเพื่อจัดเตรียมของแถม",
    assignerName: "วิภา แสงดาว",
    department: "ฝ่ายขาย",
    priority: "medium",
    status: "review",
    dueDate: "2026-02-24",
    qualityRating: null,
    createdAt: "2026-02-12",
    progressPercent: 90,
  },
  {
    id: "t14",
    title: "สรุปยอดขายสัปดาห์ที่ 2",
    description: "รวมยอดขายสาขาที่รับผิดชอบ สัปดาห์ที่ 2 ก.พ.",
    assignerName: "วิภา แสงดาว",
    department: "ฝ่ายขาย",
    priority: "low",
    status: "done",
    dueDate: "2026-02-14",
    qualityRating: 4,
    createdAt: "2026-02-10",
    progressPercent: 100,
  },
  {
    id: "t15",
    title: "ส่งใบเสนอราคาลูกค้า ABC Corp",
    description: "จัดทำและส่งใบเสนอราคาสินค้า 3 รายการ",
    assignerName: "วิภา แสงดาว",
    department: "ฝ่ายขาย",
    priority: "high",
    status: "todo",
    dueDate: "2026-02-21",
    qualityRating: null,
    createdAt: "2026-02-19",
    progressPercent: 0,
  },
];

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

const statusOrder: TaskStatus[] = ["in_progress", "todo", "review", "done"];

function isOverdue(task: Task): boolean {
  if (task.status === "done" || task.status === "cancelled") return false;
  return new Date(task.dueDate) < new Date("2026-02-22");
}

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= rating ? "fill-brand-500 text-brand-500" : "text-brown-200"}`}
        />
      ))}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function MyTasksPage() {
  // Fetch current user's tasks from API
  const { data, loading, error, refetch } = useApi<MyTasksResponse>("/api/tasks?assignedTo=current");

  // Use API data or fallback to mockup
  const myTasks = data?.tasks ?? fallbackTasks;
  const currentEmployee = data?.employee ?? fallbackEmployee;

  const stats = useMemo(() => {
    if (data?.stats) return data.stats;
    // Fallback stats from mockup
    const total = myTasks.length;
    const inProgress = myTasks.filter((t) => t.status === "in_progress").length;
    const completed = myTasks.filter((t) => t.status === "done").length;
    const overdue = myTasks.filter((t) => isOverdue(t)).length;
    return { total, inProgress, completed, overdue };
  }, [data, myTasks]);

  const groupedTasks = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
      cancelled: [],
    };
    myTasks.forEach((task) => {
      groups[task.status].push(task);
    });
    return groups;
  }, [myTasks]);

  const initials = currentEmployee.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <AppShell title="งานของฉัน" subtitle="รายการงานที่ได้รับมอบหมาย">
      {/* Loading State */}
      {loading && <LoadingSkeleton rows={6} />}

      {/* Error State */}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Employee Header */}
          <Card className="mb-6 border-none shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <Avatar className="h-14 w-14 border-2 border-brand-200">
                <AvatarFallback className="bg-brand-100 text-brand-dark font-body text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-lg font-bold font-title">{currentEmployee.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {currentEmployee.position} · {currentEmployee.department}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-none shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-brand-100 p-2">
                  <ClipboardList className="h-5 w-5 text-brand-dark" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">งานทั้งหมด</p>
                  <p className="text-xl font-bold font-title text-brand-dark">{stats.total}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-brand-100 p-2">
                  <Clock className="h-5 w-5 text-brand-dark" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">กำลังทำ</p>
                  <p className="text-xl font-bold font-title text-brand-dark">{stats.inProgress}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-brand-100 p-2">
                  <CheckCircle2 className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">เสร็จสิ้น</p>
                  <p className="text-xl font-bold font-title text-brand-500">{stats.completed}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-accent-brand-100 p-2">
                  <AlertTriangle className="h-5 w-5 text-accent-brand-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">เลยกำหนด</p>
                  <p className="text-xl font-bold font-title text-accent-brand-500">{stats.overdue}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task Groups by Status */}
          <div className="space-y-6">
            {statusOrder.map((statusKey) => {
              const tasks = groupedTasks[statusKey];
              if (tasks.length === 0) return null;

              return (
                <div key={statusKey}>
                  <div className="mb-3 flex items-center gap-2">
                    <Badge className={statusConfig[statusKey].className}>
                      {statusConfig[statusKey].label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ({tasks.length} งาน)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {tasks.map((task) => {
                      const overdue = isOverdue(task);
                      return (
                        <Card key={task.id} className="border-none shadow-sm transition-shadow hover:shadow-md">
                          <CardContent className="p-5">
                            <div className="mb-3 flex items-start justify-between gap-2">
                              <h3 className="text-sm font-medium font-title leading-tight">
                                {task.title}
                              </h3>
                              <Badge className={`shrink-0 text-[10px] ${priorityConfig[task.priority].className}`}>
                                {priorityConfig[task.priority].label}
                              </Badge>
                            </div>

                            <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>

                            {/* Due date */}
                            <div className="mb-3 flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span
                                className={`text-xs ${
                                  overdue ? "font-medium text-accent-brand-500" : "text-muted-foreground"
                                }`}
                              >
                                กำหนด: {task.dueDate}
                                {overdue && " (เลยกำหนด)"}
                              </span>
                            </div>

                            {/* Progress */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">ความคืบหน้า</span>
                                <span className="font-medium text-brand-dark">{task.progressPercent}%</span>
                              </div>
                              <Progress
                                value={task.progressPercent}
                                className="mt-1 h-2 bg-brand-100 [&>div]:bg-brand-dark"
                              />
                            </div>

                            {/* Quality rating & action */}
                            <div className="flex items-center justify-between">
                              {task.qualityRating ? (
                                <RatingStars rating={task.qualityRating} />
                              ) : (
                                <span className="text-xs text-muted-foreground">ยังไม่มีคะแนน</span>
                              )}
                              <Link href={`/tasks/${task.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-brand-dark hover:bg-brand-50"
                                >
                                  <Eye className="mr-1 h-3.5 w-3.5" />
                                  ดูรายละเอียด
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </AppShell>
  );
}
