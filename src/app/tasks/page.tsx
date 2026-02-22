"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
  List,
  LayoutGrid,
  Clock,
  CheckCircle2,
  AlertTriangle,
  GripVertical,
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

interface TasksApiResponse {
  tasks: Task[];
  departments: string[];
  assignees: string[];
  stats: {
    total: number;
    inProgress: number;
    overdue: number;
    doneThisWeek: number;
  };
}

// ── Fallback Mockup Data (dev without DB) ────────────────────────────────────

const mockTasks: Task[] = [
  {
    id: "t1",
    title: "จัดทำรายงานยอดขายประจำเดือน",
    description: "รวบรวมข้อมูลยอดขายจากทุกสาขาและจัดทำรายงานสรุป",
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
    description: "ตรวจสอบและอัปเดตข้อมูลลูกค้ารายใหญ่ 50 ราย",
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
    description: "จัดเตรียมเอกสารนำเสนอผลประกอบการไตรมาส 4",
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
  {
    id: "t7",
    title: "ออกแบบแบนเนอร์โปรโมชั่นเดือน มี.ค.",
    description: "ออกแบบแบนเนอร์สำหรับหน้าเว็บและ Social Media",
    assigneeId: "u7",
    assigneeName: "ศิลป์ชัย วาดฝัน",
    assignerId: "u2",
    assignerName: "วิภา แสงดาว",
    department: "ฝ่ายการตลาด",
    priority: "medium",
    status: "todo",
    dueDate: "2026-03-01",
    qualityRating: null,
    createdAt: "2026-02-18",
  },
  {
    id: "t8",
    title: "สรุปค่าใช้จ่ายเดินทางพนักงาน",
    description: "รวบรวมและตรวจสอบใบเสร็จค่าใช้จ่ายเดินทางเดือน ก.พ.",
    assigneeId: "u5",
    assigneeName: "ประเสริฐ ก้าวหน้า",
    assignerId: "u1",
    assignerName: "สมศรี จันทร์สว่าง",
    department: "ฝ่ายบัญชีและการเงิน",
    priority: "medium",
    status: "done",
    dueDate: "2026-02-20",
    qualityRating: 3,
    createdAt: "2026-02-08",
  },
  {
    id: "t9",
    title: "ติดตามหนี้ค้างชำระลูกค้า",
    description: "ติดต่อลูกค้าที่มียอดค้างชำระเกิน 30 วัน",
    assigneeId: "u4",
    assigneeName: "สุดา เจริญสุข",
    assignerId: "u2",
    assignerName: "วิภา แสงดาว",
    department: "ฝ่ายขาย",
    priority: "high",
    status: "todo",
    dueDate: "2026-02-24",
    qualityRating: null,
    createdAt: "2026-02-15",
  },
  {
    id: "t10",
    title: "จัดทำแผนงบประมาณปี 2027",
    description: "ร่างแผนงบประมาณเบื้องต้นสำหรับทุกฝ่าย",
    assigneeId: "u5",
    assigneeName: "ประเสริฐ ก้าวหน้า",
    assignerId: "u1",
    assignerName: "สมศรี จันทร์สว่าง",
    department: "ฝ่ายบัญชีและการเงิน",
    priority: "low",
    status: "todo",
    dueDate: "2026-03-15",
    qualityRating: null,
    createdAt: "2026-02-19",
  },
];

const fallbackDepartments = [
  "ฝ่ายขาย",
  "ฝ่ายทรัพยากรบุคคล",
  "ฝ่ายบัญชีและการเงิน",
  "ฝ่ายเทคโนโลยี",
  "ฝ่ายการตลาด",
];

const fallbackAssignees = [
  ...new Set(mockTasks.map((t) => t.assigneeName)),
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

const kanbanColumns: { key: TaskStatus; label: string; color: string }[] = [
  { key: "todo", label: "รอดำเนินการ", color: "border-t-brown-400" },
  { key: "in_progress", label: "กำลังทำ", color: "border-t-brand-dark" },
  { key: "review", label: "รอตรวจสอบ", color: "border-t-brand-500" },
  { key: "done", label: "เสร็จสิ้น", color: "border-t-brand-700" },
];

function isOverdue(task: Task): boolean {
  if (task.status === "done" || task.status === "cancelled") return false;
  return new Date(task.dueDate) < new Date("2026-02-22");
}

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-muted-foreground">--</span>;
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

export default function TaskBoardPage() {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Build API URL with filter params
  const apiParams = new URLSearchParams();
  if (statusFilter !== "all") apiParams.set("status", statusFilter);
  if (priorityFilter !== "all") apiParams.set("priority", priorityFilter);
  if (departmentFilter !== "all") apiParams.set("department", departmentFilter);
  if (assigneeFilter !== "all") apiParams.set("assignee", assigneeFilter);
  if (searchQuery) apiParams.set("search", searchQuery);
  const queryString = apiParams.toString();
  const apiUrl = `/api/tasks${queryString ? `?${queryString}` : ""}`;

  const { data, loading, error, refetch } = useApi<TasksApiResponse>(apiUrl);

  // Use API data or fallback to mockup
  const tasks = data?.tasks ?? mockTasks;
  const departments = data?.departments ?? fallbackDepartments;
  const assignees = data?.assignees ?? fallbackAssignees;

  const filteredTasks = useMemo(() => {
    // If data came from API, server already filtered; just return
    if (data?.tasks) return data.tasks;
    // Fallback: client-side filter on mockup data
    return tasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
      if (departmentFilter !== "all" && task.department !== departmentFilter) return false;
      if (assigneeFilter !== "all" && task.assigneeName !== assigneeFilter) return false;
      if (
        searchQuery &&
        !task.title.includes(searchQuery) &&
        !task.assigneeName.includes(searchQuery) &&
        !task.description.includes(searchQuery)
      )
        return false;
      return true;
    });
  }, [data, tasks, statusFilter, priorityFilter, departmentFilter, assigneeFilter, searchQuery]);

  const stats = useMemo(() => {
    if (data?.stats) return data.stats;
    // Fallback stats from mockup
    const total = mockTasks.length;
    const inProgress = mockTasks.filter((t) => t.status === "in_progress").length;
    const overdue = mockTasks.filter((t) => isOverdue(t)).length;
    const doneThisWeek = mockTasks.filter(
      (t) => t.status === "done" && new Date(t.dueDate) >= new Date("2026-02-16")
    ).length;
    return { total, inProgress, overdue, doneThisWeek };
  }, [data]);

  return (
    <AppShell title="บอร์ดงาน" subtitle="จัดการและติดตามงานทั้งหมด">
      {/* Loading State */}
      {loading && <LoadingSkeleton rows={8} />}

      {/* Error State */}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Stats Row */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-none shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-brand-100 p-2">
                  <List className="h-5 w-5 text-brand-dark" />
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
                <div className="rounded-lg bg-accent-brand-100 p-2">
                  <AlertTriangle className="h-5 w-5 text-accent-brand-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">เลยกำหนด</p>
                  <p className="text-xl font-bold font-title text-accent-brand-500">{stats.overdue}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-brand-100 p-2">
                  <CheckCircle2 className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">เสร็จสัปดาห์นี้</p>
                  <p className="text-xl font-bold font-title text-brand-500">{stats.doneThisWeek}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Actions */}
          <Card className="mb-4 border-none shadow-sm">
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาชื่องาน, ผู้รับผิดชอบ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="ความสำคัญ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกระดับ</SelectItem>
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="แผนก" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกแผนก</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="ผู้รับผิดชอบ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกคน</SelectItem>
                  {assignees.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 rounded-lg border p-1">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className={`h-8 w-8 ${viewMode === "list" ? "bg-brand-dark hover:bg-brand-700" : ""}`}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "kanban" ? "default" : "ghost"}
                  size="icon"
                  className={`h-8 w-8 ${viewMode === "kanban" ? "bg-brand-dark hover:bg-brand-700" : ""}`}
                  onClick={() => setViewMode("kanban")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
              <Link href="/tasks/create">
                <Button size="sm" className="bg-brand-dark hover:bg-brand-700">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  มอบหมายงาน
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* List View */}
          {viewMode === "list" && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-title">
                  ผลการค้นหา ({filteredTasks.length} รายการ)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>ชื่องาน</TableHead>
                      <TableHead>ผู้รับผิดชอบ</TableHead>
                      <TableHead>ความสำคัญ</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>กำหนดส่ง</TableHead>
                      <TableHead>คะแนนคุณภาพ</TableHead>
                      <TableHead className="w-[80px]">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                          ไม่พบรายการงานที่ตรงกับเงื่อนไข
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTasks.map((task, index) => {
                        const overdue = isOverdue(task);
                        return (
                          <TableRow key={task.id} className="hover:bg-brand-50/50">
                            <TableCell className="text-sm text-muted-foreground">
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{task.title}</p>
                                <p className="text-xs text-muted-foreground">{task.department}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{task.assigneeName}</TableCell>
                            <TableCell>
                              <Badge className={priorityConfig[task.priority].className}>
                                {priorityConfig[task.priority].label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={statusConfig[task.status].className}>
                                {statusConfig[task.status].label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className={`text-sm ${overdue ? "text-accent-brand-500 font-medium" : ""}`}>
                                {task.dueDate}
                              </div>
                              {overdue && (
                                <span className="text-[10px] text-accent-brand-500 font-medium">
                                  เลยกำหนด
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <RatingStars rating={task.qualityRating} />
                            </TableCell>
                            <TableCell>
                              <Link href={`/tasks/${task.id}`}>
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
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Kanban View */}
          {viewMode === "kanban" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {kanbanColumns.map((col) => {
                const columnTasks = filteredTasks.filter((t) => t.status === col.key);
                return (
                  <div key={col.key} className="flex flex-col">
                    <div
                      className={`mb-3 rounded-t-lg border-t-4 ${col.color} bg-white px-4 py-3 shadow-sm`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold font-title">{col.label}</h3>
                        <Badge variant="outline" className="text-xs">
                          {columnTasks.length}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      {columnTasks.map((task) => {
                        const overdue = isOverdue(task);
                        return (
                          <Link key={task.id} href={`/tasks/${task.id}`}>
                            <Card className="cursor-pointer border-none shadow-sm transition-shadow hover:shadow-md">
                              <CardContent className="p-4">
                                <div className="mb-2 flex items-start justify-between gap-2">
                                  <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-brown-300" />
                                  <p className="flex-1 text-sm font-medium leading-tight">
                                    {task.title}
                                  </p>
                                  <Badge className={`shrink-0 text-[10px] ${priorityConfig[task.priority].className}`}>
                                    {priorityConfig[task.priority].label}
                                  </Badge>
                                </div>
                                <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
                                  {task.description}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {task.assigneeName}
                                  </span>
                                  <span
                                    className={`text-xs ${
                                      overdue ? "text-accent-brand-500 font-medium" : "text-muted-foreground"
                                    }`}
                                  >
                                    {task.dueDate}
                                  </span>
                                </div>
                                {task.qualityRating && (
                                  <div className="mt-2 flex items-center gap-1">
                                    <RatingStars rating={task.qualityRating} />
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                      {columnTasks.length === 0 && (
                        <div className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
                          ไม่มีงาน
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
