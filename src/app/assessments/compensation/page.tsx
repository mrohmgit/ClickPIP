"use client";

import { useState, useMemo } from "react";
import { useApi, useApiMutation } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";
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
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Calculator,
  Award,
  Filter,
  Search,
} from "lucide-react";

type CompStatus = "pending" | "approved" | "rejected";

interface CompensationRow {
  id: string;
  employeeName: string;
  department: string;
  grade: string;
  currentSalary: number;
  proposedIncreasePercent: number;
  proposedBonusMonths: number;
  finalIncreasePercent: number | null;
  finalBonusMonths: number | null;
  status: CompStatus;
}

// ─── Fallback mockup data for dev without DB ─────────────────────────────────
const mockCompData: CompensationRow[] = [
  { id: "c1", employeeName: "สมหญิง รักเรียน", department: "ฝ่ายขาย", grade: "A", currentSalary: 45000, proposedIncreasePercent: 8, proposedBonusMonths: 3, finalIncreasePercent: 8, finalBonusMonths: 3, status: "approved" },
  { id: "c2", employeeName: "กมล แสนสุข", department: "ฝ่ายผลิต", grade: "B+", currentSalary: 52000, proposedIncreasePercent: 6, proposedBonusMonths: 2.5, finalIncreasePercent: 6, finalBonusMonths: 2.5, status: "approved" },
  { id: "c3", employeeName: "สมชาย ใจดี", department: "ฝ่ายขาย", grade: "B+", currentSalary: 35000, proposedIncreasePercent: 6, proposedBonusMonths: 2.5, finalIncreasePercent: null, finalBonusMonths: null, status: "pending" },
  { id: "c4", employeeName: "ธนา ก้าวหน้า", department: "ฝ่ายไอที", grade: "B", currentSalary: 48000, proposedIncreasePercent: 4, proposedBonusMonths: 2, finalIncreasePercent: null, finalBonusMonths: null, status: "pending" },
  { id: "c5", employeeName: "วิชัย สุขสบาย", department: "ฝ่ายบัญชี", grade: "B", currentSalary: 38000, proposedIncreasePercent: 4, proposedBonusMonths: 2, finalIncreasePercent: 4, finalBonusMonths: 2, status: "approved" },
  { id: "c6", employeeName: "ศิริพร งามตา", department: "ฝ่ายบัญชี", grade: "B", currentSalary: 42000, proposedIncreasePercent: 4, proposedBonusMonths: 2, finalIncreasePercent: null, finalBonusMonths: null, status: "pending" },
  { id: "c7", employeeName: "พิมพ์ใจ ดีงาม", department: "ฝ่ายการตลาด", grade: "C+", currentSalary: 32000, proposedIncreasePercent: 2, proposedBonusMonths: 1.5, finalIncreasePercent: null, finalBonusMonths: null, status: "pending" },
  { id: "c8", employeeName: "จิราภรณ์ ศรีสุข", department: "ฝ่ายการตลาด", grade: "D", currentSalary: 40000, proposedIncreasePercent: 0, proposedBonusMonths: 0, finalIncreasePercent: 0, finalBonusMonths: 0, status: "rejected" },
  { id: "c9", employeeName: "นภา แสงจันทร์", department: "ฝ่ายบุคคล", grade: "B+", currentSalary: 36000, proposedIncreasePercent: 6, proposedBonusMonths: 2.5, finalIncreasePercent: null, finalBonusMonths: null, status: "pending" },
  { id: "c10", employeeName: "ปรีชา วิริยะ", department: "ฝ่ายไอที", grade: "B", currentSalary: 50000, proposedIncreasePercent: 4, proposedBonusMonths: 2, finalIncreasePercent: null, finalBonusMonths: null, status: "pending" },
];

const gradeSuggestions: Record<string, { increase: string; bonus: string }> = {
  A: { increase: "7-10%", bonus: "3-4 เดือน" },
  "B+": { increase: "5-7%", bonus: "2-3 เดือน" },
  B: { increase: "3-5%", bonus: "1.5-2 เดือน" },
  "C+": { increase: "1-3%", bonus: "1-1.5 เดือน" },
  C: { increase: "0-1%", bonus: "0.5-1 เดือน" },
  D: { increase: "0%", bonus: "0 เดือน" },
};

const statusConfig: Record<CompStatus, { label: string; className: string }> = {
  pending: { label: "รอพิจารณา", className: "bg-brown-200 text-brown-800 hover:bg-brown-200" },
  approved: { label: "อนุมัติ", className: "bg-brand-500 text-white hover:bg-brand-500" },
  rejected: { label: "ไม่อนุมัติ", className: "bg-accent-brand-100 text-accent-brand-700 hover:bg-accent-brand-100" },
};

function getGradeClassName(grade: string): string {
  if (grade === "A") return "bg-brand-500 text-white";
  if (grade === "B+") return "bg-brand-dark text-white";
  if (grade === "B") return "bg-brand-100 text-brand-dark";
  if (grade === "C+") return "bg-brown-200 text-brown-800";
  if (grade === "C") return "bg-brown-300 text-brown-900";
  return "bg-accent-brand-100 text-accent-brand-700";
}

export default function CompensationPage() {
  const { data: apiData, loading, error, refetch } = useApi<CompensationRow[]>("/api/assessments/compensation");
  const { mutate, loading: actionLoading } = useApiMutation("/api/assessments/compensation");

  const [localData, setLocalData] = useState<CompensationRow[] | null>(null);
  const [selectedCycle, setSelectedCycle] = useState("ac-3");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const data = localData ?? apiData ?? mockCompData;

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (searchQuery && !row.employeeName.includes(searchQuery) && !row.department.includes(searchQuery))
        return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      return true;
    });
  }, [data, searchQuery, statusFilter]);

  const totalBudgetIncrease = useMemo(() => {
    return data.reduce((sum, row) => {
      const increase = row.finalIncreasePercent ?? row.proposedIncreasePercent;
      return sum + (row.currentSalary * increase) / 100;
    }, 0);
  }, [data]);

  const totalBonusCost = useMemo(() => {
    return data.reduce((sum, row) => {
      const bonus = row.finalBonusMonths ?? row.proposedBonusMonths;
      return sum + row.currentSalary * bonus;
    }, 0);
  }, [data]);

  const approvedCount = data.filter((r) => r.status === "approved").length;
  const pendingCount = data.filter((r) => r.status === "pending").length;

  const handleApprove = async (id: string) => {
    const row = data.find((r) => r.id === id);
    if (!row) return;

    await mutate({
      method: "PUT",
      body: {
        id,
        action: "approve",
        finalIncreasePercent: row.finalIncreasePercent ?? row.proposedIncreasePercent,
        finalBonusMonths: row.finalBonusMonths ?? row.proposedBonusMonths,
      },
      onSuccess: () => {
        setLocalData((prev) =>
          (prev ?? data).map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "approved" as CompStatus,
                  finalIncreasePercent: r.finalIncreasePercent ?? r.proposedIncreasePercent,
                  finalBonusMonths: r.finalBonusMonths ?? r.proposedBonusMonths,
                }
              : r
          )
        );
      },
      onError: () => {
        // Fallback for dev without DB
        setLocalData((prev) =>
          (prev ?? data).map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "approved" as CompStatus,
                  finalIncreasePercent: r.finalIncreasePercent ?? r.proposedIncreasePercent,
                  finalBonusMonths: r.finalBonusMonths ?? r.proposedBonusMonths,
                }
              : r
          )
        );
      },
    });
  };

  const handleReject = async (id: string) => {
    await mutate({
      method: "PUT",
      body: { id, action: "reject" },
      onSuccess: () => {
        setLocalData((prev) =>
          (prev ?? data).map((r) =>
            r.id === id
              ? { ...r, status: "rejected" as CompStatus, finalIncreasePercent: 0, finalBonusMonths: 0 }
              : r
          )
        );
      },
      onError: () => {
        // Fallback for dev without DB
        setLocalData((prev) =>
          (prev ?? data).map((r) =>
            r.id === id
              ? { ...r, status: "rejected" as CompStatus, finalIncreasePercent: 0, finalBonusMonths: 0 }
              : r
          )
        );
      },
    });
  };

  const handleBulkApprove = async () => {
    await mutate({
      method: "PUT",
      body: { action: "bulk_approve" },
      onSuccess: () => {
        setLocalData((prev) =>
          (prev ?? data).map((r) =>
            r.status === "pending"
              ? {
                  ...r,
                  status: "approved" as CompStatus,
                  finalIncreasePercent: r.finalIncreasePercent ?? r.proposedIncreasePercent,
                  finalBonusMonths: r.finalBonusMonths ?? r.proposedBonusMonths,
                }
              : r
          )
        );
      },
      onError: () => {
        // Fallback for dev without DB
        setLocalData((prev) =>
          (prev ?? data).map((r) =>
            r.status === "pending"
              ? {
                  ...r,
                  status: "approved" as CompStatus,
                  finalIncreasePercent: r.finalIncreasePercent ?? r.proposedIncreasePercent,
                  finalBonusMonths: r.finalBonusMonths ?? r.proposedBonusMonths,
                }
              : r
          )
        );
      },
    });
  };

  const updateFinalIncrease = (id: string, value: string) => {
    const num = Number(value);
    setLocalData((prev) =>
      (prev ?? data).map((row) =>
        row.id === id ? { ...row, finalIncreasePercent: value === "" ? null : num } : row
      )
    );
  };

  const updateFinalBonus = (id: string, value: string) => {
    const num = Number(value);
    setLocalData((prev) =>
      (prev ?? data).map((row) =>
        row.id === id ? { ...row, finalBonusMonths: value === "" ? null : num } : row
      )
    );
  };

  return (
    <AppShell
      title="วางแผนค่าตอบแทน"
      subtitle="ปรับเงินเดือนและโบนัสตามผลประเมิน"
    >
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          {/* Cycle Selector */}
          <Card className="mb-6 border-none shadow-sm">
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-brand-dark" />
                <span className="text-sm font-medium">เลือกรอบประเมิน:</span>
              </div>
              <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ac-3">ประเมินผลงานประจำปี 2025</SelectItem>
                  <SelectItem value="ac-2">ประเมินผลงาน H2/2025</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-none shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-brand-100 p-2.5">
                  <Users className="h-5 w-5 text-brand-dark" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">พนักงานทั้งหมด</p>
                  <p className="text-2xl font-bold font-title">{data.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-brand-100 p-2.5">
                  <CheckCircle2 className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">อนุมัติแล้ว</p>
                  <p className="text-2xl font-bold font-title text-brand-dark">
                    {approvedCount}/{data.length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-brown-100 p-2.5">
                  <TrendingUp className="h-5 w-5 text-brown-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">งบปรับเงินเดือน/เดือน</p>
                  <p className="text-lg font-bold font-title">
                    {totalBudgetIncrease.toLocaleString()} บาท
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-brand-100 p-2.5">
                  <DollarSign className="h-5 w-5 text-brand-dark" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">งบโบนัสรวม</p>
                  <p className="text-lg font-bold font-title">
                    {totalBonusCost.toLocaleString()} บาท
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grade Suggestions */}
          <Card className="mb-6 border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-title">
                <Calculator className="h-4 w-4 text-brand-dark" />
                แนะนำค่าตอบแทนตามเกรด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {Object.entries(gradeSuggestions).map(([grade, suggestion]) => (
                  <div key={grade} className="flex items-center gap-2 rounded-lg border p-3">
                    <Badge className={`${getGradeClassName(grade)} hover:${getGradeClassName(grade)}`}>
                      {grade}
                    </Badge>
                    <div className="text-xs">
                      <p>ขึ้นเงินเดือน: <span className="font-medium">{suggestion.increase}</span></p>
                      <p>โบนัส: <span className="font-medium">{suggestion.bonus}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Filters & Actions */}
          <Card className="mb-4 border-none shadow-sm">
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาชื่อพนักงาน, แผนก..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="pending">รอพิจารณา</SelectItem>
                  <SelectItem value="approved">อนุมัติ</SelectItem>
                  <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
                </SelectContent>
              </Select>
              {pendingCount > 0 && (
                <Button
                  size="sm"
                  className="bg-brand-dark hover:bg-brand-700"
                  onClick={handleBulkApprove}
                  disabled={actionLoading}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {actionLoading ? "กำลังดำเนินการ..." : `อนุมัติทั้งหมด (${pendingCount})`}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Compensation Table */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-title">
                ตารางค่าตอบแทน ({filteredData.length} คน)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>พนักงาน</TableHead>
                      <TableHead>แผนก</TableHead>
                      <TableHead className="text-center">เกรด</TableHead>
                      <TableHead className="text-right">เงินเดือนปัจจุบัน</TableHead>
                      <TableHead className="text-center">ขึ้น % (แนะนำ)</TableHead>
                      <TableHead className="text-center">โบนัส (แนะนำ)</TableHead>
                      <TableHead className="text-center">ขึ้น % (สุดท้าย)</TableHead>
                      <TableHead className="text-center">โบนัส (สุดท้าย)</TableHead>
                      <TableHead className="text-center">สถานะ</TableHead>
                      <TableHead className="w-[120px]">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="py-12 text-center text-muted-foreground"
                        >
                          ไม่พบข้อมูลที่ตรงกับเงื่อนไข
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((row) => (
                        <TableRow key={row.id} className="hover:bg-brand-50/50">
                          <TableCell className="font-medium">{row.employeeName}</TableCell>
                          <TableCell className="text-sm">{row.department}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={`${getGradeClassName(row.grade)} hover:${getGradeClassName(row.grade)}`}>
                              {row.grade}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {row.currentSalary.toLocaleString()} บาท
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {row.proposedIncreasePercent}%
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {row.proposedBonusMonths} เดือน
                          </TableCell>
                          <TableCell className="text-center">
                            {row.status === "pending" ? (
                              <Input
                                type="number"
                                min={0}
                                max={20}
                                step={0.5}
                                value={row.finalIncreasePercent ?? ""}
                                onChange={(e) => updateFinalIncrease(row.id, e.target.value)}
                                className="mx-auto w-20 text-center text-sm"
                                placeholder="%"
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {row.finalIncreasePercent !== null ? `${row.finalIncreasePercent}%` : "—"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {row.status === "pending" ? (
                              <Input
                                type="number"
                                min={0}
                                max={12}
                                step={0.5}
                                value={row.finalBonusMonths ?? ""}
                                onChange={(e) => updateFinalBonus(row.id, e.target.value)}
                                className="mx-auto w-20 text-center text-sm"
                                placeholder="เดือน"
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {row.finalBonusMonths !== null ? `${row.finalBonusMonths}` : "—"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={statusConfig[row.status].className}>
                              {statusConfig[row.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {row.status === "pending" && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-brand-dark hover:bg-brand-50"
                                  onClick={() => handleApprove(row.id)}
                                  title="อนุมัติ"
                                  disabled={actionLoading}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-accent-brand-500 hover:bg-accent-brand-50"
                                  onClick={() => handleReject(row.id)}
                                  title="ไม่อนุมัติ"
                                  disabled={actionLoading}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {row.status !== "pending" && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Budget Summary */}
          <Card className="mt-6 border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-title">
                <DollarSign className="h-4 w-4 text-brand-dark" />
                สรุปงบประมาณ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-brand-50 p-4">
                  <p className="text-xs text-muted-foreground">งบปรับเงินเดือน/เดือน</p>
                  <p className="mt-1 text-xl font-bold font-title text-brand-dark">
                    {totalBudgetIncrease.toLocaleString()} บาท
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ต่อปี: {(totalBudgetIncrease * 12).toLocaleString()} บาท
                  </p>
                </div>
                <div className="rounded-lg bg-brown-50 p-4">
                  <p className="text-xs text-muted-foreground">งบโบนัสรวม</p>
                  <p className="mt-1 text-xl font-bold font-title text-brown-700">
                    {totalBonusCost.toLocaleString()} บาท
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">งบรวมทั้งหมด (ปี)</p>
                  <p className="mt-1 text-xl font-bold font-title">
                    {(totalBudgetIncrease * 12 + totalBonusCost).toLocaleString()} บาท
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}
