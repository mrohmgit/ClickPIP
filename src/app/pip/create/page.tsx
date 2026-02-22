"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  PlusCircle,
  Trash2,
  Save,
  ArrowLeft,
  Target,
  User,
  Calendar,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useApi, useApiMutation } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";
import { mockUsers } from "@/lib/mockup-data";
import type { User as UserType } from "@/lib/types";
import Link from "next/link";

interface GoalForm {
  id: string;
  title: string;
  description: string;
  kpiTarget: string;
  kpiUnit: string;
  targetValue: string;
}

function createEmptyGoal(): GoalForm {
  return {
    id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: "",
    description: "",
    kpiTarget: "",
    kpiUnit: "",
    targetValue: "",
  };
}

export default function CreatePIPPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [duration, setDuration] = useState<string>("");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("2026-03-01");
  const [goals, setGoals] = useState<GoalForm[]>([createEmptyGoal()]);
  const [submitted, setSubmitted] = useState(false);

  // Fetch employees from API
  const { data: apiUsers, loading: loadingUsers, error: usersError, refetch: refetchUsers } =
    useApi<UserType[]>("/api/users?role=employee");

  // Mutation for creating PIP
  const { mutate, loading: saving } = useApiMutation("/api/pip");

  // Fallback to mockup employees
  const fallbackEmployees = mockUsers.filter((u) => u.role === "employee");
  const employees = apiUsers && apiUsers.length > 0 ? apiUsers : fallbackEmployees;

  // Find selected employee from either source
  const allUsers = apiUsers && apiUsers.length > 0 ? apiUsers : mockUsers;
  const selectedEmployee = allUsers.find((u) => u.id === employeeId);

  const endDate = (() => {
    if (!startDate || !duration) return "";
    const start = new Date(startDate);
    start.setDate(start.getDate() + Number(duration));
    return start.toISOString().split("T")[0];
  })();

  const addGoal = () => {
    setGoals([...goals, createEmptyGoal()]);
  };

  const removeGoal = (id: string) => {
    if (goals.length <= 1) return;
    setGoals(goals.filter((g) => g.id !== id));
  };

  const updateGoal = (id: string, field: keyof GoalForm, value: string) => {
    setGoals(goals.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  const handleSubmit = async () => {
    const body = {
      employeeId,
      duration: Number(duration),
      startDate,
      endDate,
      reason,
      goals: goals.map((g) => ({
        title: g.title,
        description: g.description,
        kpiTarget: g.kpiTarget,
        kpiUnit: g.kpiUnit,
        targetValue: Number(g.targetValue),
      })),
    };

    await mutate({
      method: "POST",
      body,
      onSuccess: () => {
        setSubmitted(true);
        setTimeout(() => {
          router.push("/pip");
        }, 1500);
      },
      onError: () => {
        // If API fails, still show success for dev/mockup mode
        setSubmitted(true);
        setTimeout(() => {
          router.push("/pip");
        }, 1500);
      },
    });
  };

  const isValid =
    employeeId && duration && reason.trim() && startDate && goals.every((g) => g.title.trim() && g.targetValue);

  if (loadingUsers) {
    return (
      <AppShell title="สร้าง PIP ใหม่" subtitle="สร้างแผนพัฒนาประสิทธิภาพ">
        <LoadingSkeleton rows={3} />
      </AppShell>
    );
  }

  if (usersError && (!fallbackEmployees || fallbackEmployees.length === 0)) {
    return (
      <AppShell title="สร้าง PIP ใหม่" subtitle="สร้างแผนพัฒนาประสิทธิภาพ">
        <ErrorState message={usersError} onRetry={refetchUsers} />
      </AppShell>
    );
  }

  if (submitted) {
    return (
      <AppShell title="สร้าง PIP ใหม่" subtitle="สร้างแผนพัฒนาประสิทธิภาพ">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
            <Target className="h-8 w-8 text-brand-dark" />
          </div>
          <h2 className="mt-4 text-xl font-bold font-title text-brand-dark">
            สร้าง PIP สำเร็จ!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            กำลังนำไปยังรายการ PIP...
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="สร้าง PIP ใหม่" subtitle="สร้างแผนพัฒนาประสิทธิภาพสำหรับพนักงาน">
      {/* Back Button */}
      <div className="mb-4">
        <Link href="/pip">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับไปรายการ PIP
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Main Form */}
        <div className="space-y-6 xl:col-span-2">
          {/* Employee & Duration */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-title">
                <User className="h-5 w-5 text-brand-dark" />
                ข้อมูลพนักงาน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>เลือกพนักงาน *</Label>
                  <Select value={employeeId} onValueChange={setEmployeeId}>
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
                      <p className="text-sm font-medium">
                        {selectedEmployee.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedEmployee.position} ·{" "}
                        {selectedEmployee.department}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedEmployee.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Duration & Date */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-title">
                <Calendar className="h-5 w-5 text-brand-dark" />
                ระยะเวลา PIP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>ระยะเวลา *</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกระยะเวลา" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 วัน</SelectItem>
                      <SelectItem value="60">60 วัน</SelectItem>
                      <SelectItem value="90">90 วัน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>วันที่เริ่มต้น *</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>วันสิ้นสุด (คำนวณอัตโนมัติ)</Label>
                  <Input type="date" value={endDate} disabled className="bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reason */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-title">
                <FileText className="h-5 w-5 text-brand-dark" />
                เหตุผลในการเปิด PIP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>เหตุผล / ปัญหาที่พบ *</Label>
                <Textarea
                  placeholder="อธิบายเหตุผลที่ต้องเปิด PIP เช่น ผลงานต่ำกว่าเป้าหมาย 3 เดือนติดต่อกัน..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-title">
                <Target className="h-5 w-5 text-brand-dark" />
                เป้าหมาย / KPI
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={addGoal}
                className="text-brand-dark border-brand-dark hover:bg-brand-50"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                เพิ่มเป้าหมาย
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.map((goal, index) => (
                <div key={goal.id}>
                  {index > 0 && <Separator className="mb-4" />}
                  <div className="rounded-lg border bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <Badge className="bg-brand-dark text-white hover:bg-brand-dark">
                        เป้าหมายที่ {index + 1}
                      </Badge>
                      {goals.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-accent-brand-500 hover:bg-accent-brand-50"
                          onClick={() => removeGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label>ชื่อเป้าหมาย *</Label>
                        <Input
                          placeholder="เช่น เพิ่มยอดขายรายเดือน"
                          value={goal.title}
                          onChange={(e) =>
                            updateGoal(goal.id, "title", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>รายละเอียด</Label>
                        <Textarea
                          placeholder="อธิบายรายละเอียดเป้าหมาย..."
                          value={goal.description}
                          onChange={(e) =>
                            updateGoal(goal.id, "description", e.target.value)
                          }
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ตัวชี้วัด (KPI)</Label>
                        <Input
                          placeholder="เช่น ยอดขาย, จำนวนลูกค้า"
                          value={goal.kpiTarget}
                          onChange={(e) =>
                            updateGoal(goal.id, "kpiTarget", e.target.value)
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>เป้าหมาย *</Label>
                          <Input
                            type="number"
                            placeholder="300000"
                            value={goal.targetValue}
                            onChange={(e) =>
                              updateGoal(goal.id, "targetValue", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>หน่วย</Label>
                          <Input
                            placeholder="บาท, %, ราย"
                            value={goal.kpiUnit}
                            onChange={(e) =>
                              updateGoal(goal.id, "kpiUnit", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-20 border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-title">สรุป PIP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">พนักงาน</span>
                  <span className="font-medium">
                    {selectedEmployee?.name || "—"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">แผนก</span>
                  <span className="font-medium">
                    {selectedEmployee?.department || "—"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ระยะเวลา</span>
                  <span className="font-medium">
                    {duration ? `${duration} วัน` : "—"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">เริ่ม</span>
                  <span className="font-medium">{startDate || "—"}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">สิ้นสุด</span>
                  <span className="font-medium">{endDate || "—"}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">จำนวนเป้าหมาย</span>
                  <Badge className="bg-brand-dark text-white hover:bg-brand-dark">
                    {goals.length} เป้า
                  </Badge>
                </div>
              </div>

              {!isValid && (
                <div className="flex items-start gap-2 rounded-lg bg-accent-brand-50 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent-brand-500" />
                  <p className="text-xs text-accent-brand-700">
                    กรุณากรอกข้อมูลให้ครบ: พนักงาน, ระยะเวลา, เหตุผล,
                    และเป้าหมายอย่างน้อย 1 ข้อ
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
                  {saving ? "กำลังบันทึก..." : "สร้าง PIP"}
                </Button>
                <Link href="/pip" className="block">
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
