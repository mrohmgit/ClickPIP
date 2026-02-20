"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockPIPs, mockDashboardStats, mockCheckIns } from "@/lib/mockup-data";
import Link from "next/link";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }
> = {
  active: {
    label: "กำลังดำเนินการ",
    variant: "default",
    className: "bg-brand-dark text-white hover:bg-brand-dark",
  },
  completed: {
    label: "สำเร็จ",
    variant: "default",
    className: "bg-brand-500 text-white hover:bg-brand-500",
  },
  failed: {
    label: "ไม่ผ่าน",
    variant: "destructive",
    className: "bg-accent-brand-500 text-white hover:bg-accent-brand-500",
  },
  pending: {
    label: "รอดำเนินการ",
    variant: "secondary",
    className: "bg-brown-200 text-brown-800 hover:bg-brown-200",
  },
  extended: {
    label: "ขยายเวลา",
    variant: "outline",
    className: "border-brand-dark text-brand-dark hover:bg-brand-50",
  },
};

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-bold font-title">{value}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`rounded-lg p-2.5 ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const percent = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-brand-100">
        <div
          className="h-2 rounded-full bg-brand-dark transition-all"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground">{percent}%</span>
    </div>
  );
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date("2026-02-20");
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const activePIPs = mockPIPs.filter((p) => p.status === "active");
  const recentCheckIns = mockCheckIns.slice(-3);

  return (
    <AppShell title="แดชบอร์ด" subtitle="ภาพรวมแผนพัฒนาประสิทธิภาพ (PIP)">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="PIP ที่กำลังดำเนินการ"
          value={mockDashboardStats.totalActive}
          icon={Target}
          color="bg-brand-dark"
        />
        <StatCard
          title="สำเร็จ"
          value={mockDashboardStats.totalCompleted}
          icon={CheckCircle2}
          color="bg-brand-500"
        />
        <StatCard
          title="ไม่ผ่าน"
          value={mockDashboardStats.totalFailed}
          icon={XCircle}
          color="bg-accent-brand-500"
        />
        <StatCard
          title="รอดำเนินการ"
          value={mockDashboardStats.totalPending}
          icon={Clock}
          color="bg-brown-500"
        />
        <StatCard
          title="ใกล้ครบกำหนด"
          value={mockDashboardStats.nearDeadline}
          icon={AlertTriangle}
          color="bg-accent-brand-400"
          subtitle="ภายใน 14 วัน"
        />
        <StatCard
          title="อัตราผ่าน"
          value={`${mockDashboardStats.passRate}%`}
          icon={TrendingUp}
          color="bg-brand-700"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Active PIPs Table */}
        <Card className="border-none shadow-sm xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-title">
              PIP ที่กำลังดำเนินการ
            </CardTitle>
            <Link href="/pip">
              <Button variant="ghost" size="sm" className="text-brand-dark">
                ดูทั้งหมด <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>พนักงาน</TableHead>
                  <TableHead>แผนก</TableHead>
                  <TableHead>ระยะเวลา</TableHead>
                  <TableHead>เหลือ</TableHead>
                  <TableHead>ความคืบหน้า</TableHead>
                  <TableHead>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activePIPs.map((pip) => {
                  const daysLeft = getDaysRemaining(pip.endDate);
                  const totalGoals = pip.goals.length;
                  const achievedGoals = pip.goals.filter(
                    (g) => g.status === "achieved"
                  ).length;
                  const avgProgress =
                    totalGoals > 0
                      ? Math.round(
                          pip.goals.reduce(
                            (sum, g) =>
                              sum +
                              Math.min((g.currentValue / g.targetValue) * 100, 100),
                            0
                          ) / totalGoals
                        )
                      : 0;

                  return (
                    <TableRow key={pip.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{pip.employeeName}</p>
                          <p className="text-xs text-muted-foreground">
                            {pip.employeePosition}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {pip.employeeDepartment}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{pip.duration} วัน</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            daysLeft <= 14
                              ? "bg-accent-brand-100 text-accent-brand-700 hover:bg-accent-brand-100"
                              : "bg-brand-100 text-brand-dark hover:bg-brand-100"
                          }
                        >
                          {daysLeft} วัน
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-32">
                        <ProgressBar value={avgProgress} max={100} />
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {achievedGoals}/{totalGoals} เป้าหมาย
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[pip.status].className}>
                          {statusConfig[pip.status].label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Near Deadline */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-title">
                <AlertTriangle className="h-5 w-5 text-accent-brand-500" />
                ใกล้ครบกำหนด
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {activePIPs
                .filter((p) => getDaysRemaining(p.endDate) <= 30)
                .map((pip) => {
                  const daysLeft = getDaysRemaining(pip.endDate);
                  return (
                    <div
                      key={pip.id}
                      className="flex items-center justify-between rounded-lg border border-accent-brand-200 bg-accent-brand-50 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {pip.employeeName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pip.employeeDepartment} · {pip.duration} วัน
                        </p>
                      </div>
                      <Badge className="bg-accent-brand-500 text-white hover:bg-accent-brand-600">
                        เหลือ {daysLeft} วัน
                      </Badge>
                    </div>
                  );
                })}
            </CardContent>
          </Card>

          {/* Recent Check-ins */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-title">
                <Users className="h-5 w-5 text-brand-dark" />
                Check-in ล่าสุด
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {recentCheckIns.map((ci) => {
                const pip = mockPIPs.find((p) => p.id === ci.pipId);
                return (
                  <div
                    key={ci.id}
                    className="rounded-lg border bg-white p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {pip?.employeeName}
                      </p>
                      <Badge variant="outline" className="text-[10px]">
                        สัปดาห์ที่ {ci.weekNumber}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {ci.managerNote}
                    </p>
                    <p className="mt-1 text-[10px] text-brown-400">
                      {ci.date}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* All PIPs Summary */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-title">
                สรุปทั้งหมด
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {Object.entries(statusConfig).map(([key, config]) => {
                  const count = mockPIPs.filter(
                    (p) => p.status === key
                  ).length;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-lg p-2"
                    >
                      <div className="flex items-center gap-2">
                        <Badge className={`${config.className} h-5 text-[10px]`}>
                          {config.label}
                        </Badge>
                      </div>
                      <span className="text-lg font-bold font-title">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
