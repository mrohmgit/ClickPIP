"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Users,
  Target,
  TrendingUp,
  Settings2,
  ArrowLeft,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";

interface Employee {
  id: string;
  name: string;
  position: string;
  role: string;
  status: string;
}

interface DepartmentDetail {
  name: string;
  manager: string;
  memberCount: number;
  avgScore: number;
  completedKPIs: number;
  pendingKPIs: number;
  employees: Employee[];
}

// Fallback mockup data for development without DB
const departmentData: Record<string, DepartmentDetail> = {
  sales: {
    name: "ฝ่ายขาย",
    manager: "สมชาย วงศ์สวัสดิ์",
    memberCount: 24,
    avgScore: 78,
    completedKPIs: 5,
    pendingKPIs: 3,
    employees: [
      { id: "e1", name: "กิตติ สุขสมบูรณ์", position: "พนักงานขาย", role: "พนักงาน", status: "active" },
      { id: "e2", name: "นภา แสงจันทร์", position: "หัวหน้าทีมขาย", role: "หัวหน้าทีม", status: "active" },
      { id: "e3", name: "พิชัย มงคลชัย", position: "พนักงานขาย", role: "พนักงาน", status: "pip" },
      { id: "e4", name: "สุนิสา อินทร์ทอง", position: "พนักงานขายอาวุโส", role: "พนักงานอาวุโส", status: "active" },
      { id: "e5", name: "ธีรพล วัฒนา", position: "พนักงานขาย", role: "พนักงาน", status: "probation" },
      { id: "e6", name: "อรทัย บุญมี", position: "ผู้ช่วยผู้จัดการ", role: "ผู้ช่วยผู้จัดการ", status: "active" },
    ],
  },
  operations: {
    name: "ฝ่ายปฏิบัติการ",
    manager: "วิภา ศรีสุข",
    memberCount: 32,
    avgScore: 82,
    completedKPIs: 9,
    pendingKPIs: 3,
    employees: [
      { id: "e7", name: "ประสิทธิ์ เจริญสุข", position: "หัวหน้าปฏิบัติการ", role: "หัวหน้าทีม", status: "active" },
      { id: "e8", name: "รัตนา สมบัติดี", position: "เจ้าหน้าที่ปฏิบัติการ", role: "พนักงาน", status: "active" },
      { id: "e9", name: "สมศักดิ์ พรมแดง", position: "เจ้าหน้าที่ปฏิบัติการ", role: "พนักงาน", status: "pip" },
    ],
  },
  hr: {
    name: "ฝ่ายทรัพยากรบุคคล",
    manager: "พรทิพย์ จันทร์เพ็ญ",
    memberCount: 10,
    avgScore: 85,
    completedKPIs: 4,
    pendingKPIs: 2,
    employees: [
      { id: "e10", name: "วรรณา สุขใจ", position: "เจ้าหน้าที่ HR", role: "พนักงาน", status: "active" },
      { id: "e11", name: "ชาติชาย กล้าหาญ", position: "เจ้าหน้าที่สรรหา", role: "พนักงาน", status: "active" },
    ],
  },
  marketing: {
    name: "ฝ่ายการตลาด",
    manager: "ธนพล รัตนะ",
    memberCount: 18,
    avgScore: 74,
    completedKPIs: 6,
    pendingKPIs: 3,
    employees: [
      { id: "e12", name: "ปิยะ นาคทอง", position: "นักการตลาด", role: "พนักงาน", status: "active" },
      { id: "e13", name: "ฐิติมา รุ่งเรือง", position: "หัวหน้าทีมดิจิทัล", role: "หัวหน้าทีม", status: "active" },
      { id: "e14", name: "อนุชา สิทธิ์ศรี", position: "นักออกแบบกราฟิก", role: "พนักงาน", status: "probation" },
    ],
  },
  admin: {
    name: "ฝ่ายบริหาร",
    manager: "อรุณ ประเสริฐ",
    memberCount: 8,
    avgScore: 88,
    completedKPIs: 3,
    pendingKPIs: 2,
    employees: [
      { id: "e15", name: "มาลี ศรีประเสริฐ", position: "เลขานุการ", role: "พนักงาน", status: "active" },
      { id: "e16", name: "สุวรรณ คำดี", position: "เจ้าหน้าที่ธุรการ", role: "พนักงาน", status: "active" },
    ],
  },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "ทำงานอยู่", className: "bg-brand-dark text-white hover:bg-brand-dark" },
  pip: { label: "อยู่ใน PIP", className: "bg-accent-brand-500 text-white hover:bg-accent-brand-500" },
  probation: { label: "ทดลองงาน", className: "bg-brown-500 text-white hover:bg-brown-500" },
};

export default function DepartmentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, loading, error, refetch } = useApi<DepartmentDetail>(`/api/departments/${id}`);

  // Use API data, fall back to mockup data for dev without DB
  const dept = data ?? departmentData[id] ?? null;

  if (loading) {
    return (
      <AppShell title="กำลังโหลด..." subtitle="">
        <LoadingSkeleton rows={5} />
      </AppShell>
    );
  }

  if (error && !dept) {
    return (
      <AppShell title="เกิดข้อผิดพลาด" subtitle="">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }

  if (!dept) {
    return (
      <AppShell title="ไม่พบแผนก" subtitle="">
        <p className="text-muted-foreground">ไม่พบข้อมูลแผนกที่ต้องการ</p>
      </AppShell>
    );
  }

  return (
    <AppShell title={dept.name} subtitle={`ผู้จัดการ: ${dept.manager}`}>
      {/* Back Link */}
      <div className="mb-4">
        <Link href="/departments">
          <Button variant="ghost" size="sm" className="text-brand-dark">
            <ArrowLeft className="mr-1 h-4 w-4" />
            กลับไปรายการแผนก
          </Button>
        </Link>
      </div>

      {/* Department Info Header */}
      <Card className="border-none shadow-sm mb-6">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-brand-dark p-3">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-title">{dept.name}</h2>
                <p className="text-sm text-muted-foreground">ผู้จัดการ: {dept.manager}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{dept.memberCount} คน</span>
            </div>
            <Link href={`/departments/${id}/kpi`}>
              <Button className="bg-brand-dark hover:bg-brand-700 text-white">
                <Settings2 className="mr-1 h-4 w-4" />
                ตั้งค่า KPI
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">คะแนนเฉลี่ย</p>
                <p className="mt-1 text-3xl font-bold font-title">{dept.avgScore}%</p>
              </div>
              <div className="rounded-lg bg-brand-dark p-2.5">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">จำนวนพนักงาน</p>
                <p className="mt-1 text-3xl font-bold font-title">{dept.memberCount}</p>
              </div>
              <div className="rounded-lg bg-brand-500 p-2.5">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">KPI สำเร็จ</p>
                <p className="mt-1 text-3xl font-bold font-title">{dept.completedKPIs}</p>
              </div>
              <div className="rounded-lg bg-brand-500 p-2.5">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">KPI รอดำเนินการ</p>
                <p className="mt-1 text-3xl font-bold font-title">{dept.pendingKPIs}</p>
              </div>
              <div className="rounded-lg bg-brown-500 p-2.5">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee List Table */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-title flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-dark" />
            รายชื่อพนักงานในแผนก
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>ตำแหน่ง</TableHead>
                <TableHead>บทบาท</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dept.employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell className="text-sm">{emp.position}</TableCell>
                  <TableCell className="text-sm">{emp.role}</TableCell>
                  <TableCell>
                    <Badge className={statusConfig[emp.status]?.className}>
                      {statusConfig[emp.status]?.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
