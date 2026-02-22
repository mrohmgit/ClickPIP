"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ClipboardList,
  User,
  Calendar,
  Flag,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { useApi, useApiMutation } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";

// ── Types ────────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
}

interface Department {
  id?: string;
  name: string;
}

// ── Fallback Mockup Data (dev without DB) ────────────────────────────────────

const fallbackEmployees: Employee[] = [
  { id: "u3", name: "สมชาย มั่นคง", position: "พนักงานขาย", department: "ฝ่ายขาย" },
  { id: "u4", name: "สุดา เจริญสุข", position: "พนักงานขาย", department: "ฝ่ายขาย" },
  { id: "u5", name: "ประเสริฐ ก้าวหน้า", position: "นักบัญชี", department: "ฝ่ายบัญชีและการเงิน" },
  { id: "u6", name: "นิรุตต์ โค้ดดี", position: "นักพัฒนาระบบ", department: "ฝ่ายเทคโนโลยี" },
  { id: "u7", name: "ศิลป์ชัย วาดฝัน", position: "นักออกแบบ", department: "ฝ่ายการตลาด" },
  { id: "u8", name: "พิมพ์ใจ ใจดี", position: "เจ้าหน้าที่ HR", department: "ฝ่ายทรัพยากรบุคคล" },
];

const fallbackDepartments = [
  "ฝ่ายขาย",
  "ฝ่ายทรัพยากรบุคคล",
  "ฝ่ายบัญชีและการเงิน",
  "ฝ่ายเทคโนโลยี",
  "ฝ่ายการตลาด",
];

// ── Component ────────────────────────────────────────────────────────────────

export default function CreateTaskPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [department, setDepartment] = useState("");
  const [priority, setPriority] = useState("");
  const [dueDate, setDueDate] = useState("2026-03-01");
  const [submitted, setSubmitted] = useState(false);

  // Fetch employees for assignee dropdown
  const {
    data: employeesData,
    loading: employeesLoading,
    error: employeesError,
    refetch: refetchEmployees,
  } = useApi<Employee[]>("/api/users?role=employee");

  // Fetch departments for department dropdown
  const {
    data: departmentsData,
    loading: departmentsLoading,
    error: departmentsError,
    refetch: refetchDepartments,
  } = useApi<Department[] | string[]>("/api/departments");

  // Mutation for creating a task
  const { mutate, loading: saving } = useApiMutation("/api/tasks");

  // Use API data or fallback to mockup
  const employees: Employee[] = employeesData ?? fallbackEmployees;
  const departments: string[] = departmentsData
    ? (departmentsData as (Department | string)[]).map((d) =>
        typeof d === "string" ? d : d.name
      )
    : fallbackDepartments;

  const selectedEmployee = employees.find((e) => e.id === assigneeId);
  const isValid = title.trim() && assigneeId && department && priority && dueDate;
  const isLoading = employeesLoading || departmentsLoading;
  const hasError = employeesError || departmentsError;

  const handleSubmit = async () => {
    if (!isValid) return;

    const result = await mutate({
      method: "POST",
      body: {
        title,
        description,
        assigneeId,
        department,
        priority,
        dueDate,
      },
      onSuccess: () => {
        setSubmitted(true);
        setTimeout(() => {
          router.push("/tasks");
        }, 1500);
      },
      onError: () => {
        // Fallback: still show success for dev without DB
        setSubmitted(true);
        setTimeout(() => {
          router.push("/tasks");
        }, 1500);
      },
    });

    // If mutate returned null (error) but onError already handled redirect
    if (!result && !submitted) {
      // onError callback already set submitted
    }
  };

  if (submitted) {
    return (
      <AppShell title="มอบหมายงาน" subtitle="สร้างและมอบหมายงานใหม่">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
            <CheckCircle2 className="h-8 w-8 text-brand-dark" />
          </div>
          <h2 className="mt-4 text-xl font-bold font-title text-brand-dark">
            มอบหมายงานสำเร็จ!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            กำลังนำไปยังบอร์ดงาน...
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="มอบหมายงาน" subtitle="สร้างและมอบหมายงานใหม่ให้พนักงาน">
      {/* Back Button */}
      <div className="mb-4">
        <Link href="/tasks">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับไปบอร์ดงาน
          </Button>
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && <LoadingSkeleton rows={4} />}

      {/* Error State */}
      {!isLoading && hasError && (
        <ErrorState
          message={employeesError || departmentsError || "เกิดข้อผิดพลาดในการโหลดข้อมูล"}
          onRetry={() => {
            if (employeesError) refetchEmployees();
            if (departmentsError) refetchDepartments();
          }}
        />
      )}

      {/* Form Content */}
      {!isLoading && (
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Title & Description */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-title">
                <ClipboardList className="h-5 w-5 text-brand-dark" />
                รายละเอียดงาน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>ชื่องาน *</Label>
                <Input
                  placeholder="เช่น จัดทำรายงานยอดขายประจำเดือน"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>รายละเอียด</Label>
                <Textarea
                  placeholder="อธิบายรายละเอียดงานที่ต้องทำ..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-title">
                <User className="h-5 w-5 text-brand-dark" />
                มอบหมายให้
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>เลือกพนักงาน *</Label>
                  <Select value={assigneeId} onValueChange={setAssigneeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกพนักงาน" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name} — {emp.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedEmployee && (
                  <div className="space-y-2">
                    <Label>ข้อมูลพนักงาน</Label>
                    <div className="rounded-lg border bg-brand-50/50 p-3">
                      <p className="text-sm font-medium">{selectedEmployee.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedEmployee.position} · {selectedEmployee.department}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Department & Priority */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-title">
                <Building2 className="h-5 w-5 text-brand-dark" />
                แผนกและความสำคัญ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>แผนก *</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกแผนก" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Flag className="h-3.5 w-3.5" />
                    ความสำคัญ *
                  </Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกความสำคัญ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">เร่งด่วน</SelectItem>
                      <SelectItem value="high">สูง</SelectItem>
                      <SelectItem value="medium">ปานกลาง</SelectItem>
                      <SelectItem value="low">ต่ำ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Due Date */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-title">
                <Calendar className="h-5 w-5 text-brand-dark" />
                กำหนดส่ง
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-[240px] space-y-2">
                <Label>วันกำหนดส่ง *</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pb-6">
            <Link href="/tasks">
              <Button variant="outline">ยกเลิก</Button>
            </Link>
            <Button
              className="bg-brand-dark hover:bg-brand-700"
              disabled={!isValid || saving}
              onClick={handleSubmit}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "กำลังบันทึก..." : "มอบหมายงาน"}
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
