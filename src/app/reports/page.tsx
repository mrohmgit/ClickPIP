"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Download,
  Calendar,
  FileText,
  PieChart,
} from "lucide-react";
import { mockPIPs, mockDepartments, mockUsers } from "@/lib/mockup-data";

// Compute analytics from mockup data
function useAnalytics() {
  return useMemo(() => {
    const total = mockPIPs.length;
    const active = mockPIPs.filter((p) => p.status === "active").length;
    const completed = mockPIPs.filter((p) => p.status === "completed").length;
    const failed = mockPIPs.filter((p) => p.status === "failed").length;
    const pending = mockPIPs.filter((p) => p.status === "pending").length;
    const passRate = completed + failed > 0 ? Math.round((completed / (completed + failed)) * 100) : 0;

    // By department
    const byDepartment = mockDepartments.map((dept) => {
      const deptPIPs = mockPIPs.filter((p) => p.employeeDepartment === dept.name);
      const deptCompleted = deptPIPs.filter((p) => p.status === "completed").length;
      const deptFailed = deptPIPs.filter((p) => p.status === "failed").length;
      const deptActive = deptPIPs.filter((p) => p.status === "active").length;
      const deptRate = deptCompleted + deptFailed > 0
        ? Math.round((deptCompleted / (deptCompleted + deptFailed)) * 100)
        : 0;
      return {
        ...dept,
        total: deptPIPs.length,
        active: deptActive,
        completed: deptCompleted,
        failed: deptFailed,
        passRate: deptRate,
      };
    }).filter((d) => d.total > 0);

    // By duration
    const byDuration = [30, 60, 90].map((dur) => {
      const durPIPs = mockPIPs.filter((p) => p.duration === dur);
      const durCompleted = durPIPs.filter((p) => p.status === "completed").length;
      const durFailed = durPIPs.filter((p) => p.status === "failed").length;
      return {
        duration: dur,
        total: durPIPs.length,
        completed: durCompleted,
        failed: durFailed,
        passRate: durCompleted + durFailed > 0
          ? Math.round((durCompleted / (durCompleted + durFailed)) * 100)
          : 0,
      };
    }).filter((d) => d.total > 0);

    // By manager
    const managerIds = [...new Set(mockPIPs.map((p) => p.managerId))];
    const byManager = managerIds.map((mgrId) => {
      const mgr = mockUsers.find((u) => u.id === mgrId);
      const mgrPIPs = mockPIPs.filter((p) => p.managerId === mgrId);
      const mgrCompleted = mgrPIPs.filter((p) => p.status === "completed").length;
      const mgrFailed = mgrPIPs.filter((p) => p.status === "failed").length;
      return {
        id: mgrId,
        name: mgr?.name || "ไม่ทราบ",
        department: mgr?.department || "",
        total: mgrPIPs.length,
        active: mgrPIPs.filter((p) => p.status === "active").length,
        completed: mgrCompleted,
        failed: mgrFailed,
        passRate: mgrCompleted + mgrFailed > 0
          ? Math.round((mgrCompleted / (mgrCompleted + mgrFailed)) * 100)
          : 0,
      };
    });

    // Recent PIPs
    const recentPIPs = [...mockPIPs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Avg goals per PIP
    const avgGoals = total > 0
      ? (mockPIPs.reduce((sum, p) => sum + p.goals.length, 0) / total).toFixed(1)
      : "0";

    return {
      total, active, completed, failed, pending, passRate,
      byDepartment, byDuration, byManager, recentPIPs, avgGoals,
    };
  }, []);
}

function BarVisual({ value, max, color }: { value: number; max: number; color: string }) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-4 flex-1 rounded bg-muted">
        <div
          className={`h-4 rounded ${color} transition-all`}
          style={{ width: `${Math.max(percent, 4)}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-medium">{value}</span>
    </div>
  );
}

function DonutChart({
  segments,
}: {
  segments: { value: number; color: string; label: string }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  let cumulativePercent = 0;
  const gradientParts = segments.map((seg) => {
    const start = cumulativePercent;
    const percent = (seg.value / total) * 100;
    cumulativePercent += percent;
    return `${seg.color} ${start}% ${cumulativePercent}%`;
  });

  return (
    <div className="flex items-center gap-6">
      <div
        className="h-32 w-32 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(${gradientParts.join(", ")})`,
          mask: "radial-gradient(circle, transparent 45%, black 46%)",
          WebkitMask: "radial-gradient(circle, transparent 45%, black 46%)",
        }}
      />
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: seg.color }} />
            <span className="text-sm">
              {seg.label}: <span className="font-medium">{seg.value}</span>{" "}
              <span className="text-muted-foreground">
                ({total > 0 ? Math.round((seg.value / total) * 100) : 0}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "กำลังดำเนินการ", className: "bg-brand-dark text-white hover:bg-brand-dark" },
  completed: { label: "สำเร็จ", className: "bg-brand-500 text-white hover:bg-brand-500" },
  failed: { label: "ไม่ผ่าน", className: "bg-accent-brand-500 text-white hover:bg-accent-brand-500" },
  pending: { label: "รอดำเนินการ", className: "bg-brown-200 text-brown-800 hover:bg-brown-200" },
};

export default function ReportsPage() {
  const analytics = useAnalytics();

  return (
    <AppShell title="รายงาน" subtitle="สรุปภาพรวมแผนพัฒนาประสิทธิภาพ (PIP)">
      {/* Filter Bar */}
      <Card className="mb-6 border-none shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Select defaultValue="all">
            <SelectTrigger className="w-[160px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="ช่วงเวลา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="2026">ปี 2026</SelectItem>
              <SelectItem value="2025">ปี 2025</SelectItem>
              <SelectItem value="q1-2026">Q1/2026</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[160px]">
              <Users className="mr-2 h-4 w-4" />
              <SelectValue placeholder="แผนก" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกแผนก</SelectItem>
              {mockDepartments.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-brand-100 p-2">
                <Target className="h-4 w-4 text-brand-dark" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">PIP ทั้งหมด</p>
                <p className="text-2xl font-bold font-title">{analytics.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-brand-100 p-2">
                <Clock className="h-4 w-4 text-brand-dark" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">กำลังดำเนินการ</p>
                <p className="text-2xl font-bold font-title text-brand-dark">{analytics.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-brand-100 p-2">
                <CheckCircle2 className="h-4 w-4 text-brand-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">สำเร็จ</p>
                <p className="text-2xl font-bold font-title text-brand-500">{analytics.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-accent-brand-100 p-2">
                <XCircle className="h-4 w-4 text-accent-brand-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ไม่ผ่าน</p>
                <p className="text-2xl font-bold font-title text-accent-brand-500">{analytics.failed}</p>
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
                <p className="text-xs text-muted-foreground">อัตราผ่าน</p>
                <p className="text-2xl font-bold font-title text-brand-dark">{analytics.passRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-brown-100 p-2">
                <BarChart3 className="h-4 w-4 text-brown-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">เป้าหมายเฉลี่ย/PIP</p>
                <p className="text-2xl font-bold font-title">{analytics.avgGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Status Distribution Chart */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-title">
              <PieChart className="h-5 w-5 text-brand-dark" />
              สัดส่วนสถานะ PIP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              segments={[
                { value: analytics.active, color: "#0F7134", label: "กำลังดำเนินการ" },
                { value: analytics.completed, color: "#8ac524", label: "สำเร็จ" },
                { value: analytics.failed, color: "#ff470f", label: "ไม่ผ่าน" },
                { value: analytics.pending, color: "#cdc5bb", label: "รอดำเนินการ" },
              ]}
            />
          </CardContent>
        </Card>

        {/* By Duration */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-title">
              <Calendar className="h-5 w-5 text-brand-dark" />
              สรุปตามระยะเวลา PIP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ระยะเวลา</TableHead>
                  <TableHead className="text-center">ทั้งหมด</TableHead>
                  <TableHead className="text-center">สำเร็จ</TableHead>
                  <TableHead className="text-center">ไม่ผ่าน</TableHead>
                  <TableHead className="text-center">อัตราผ่าน</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.byDuration.map((d) => (
                  <TableRow key={d.duration}>
                    <TableCell>
                      <Badge variant="outline">{d.duration} วัน</Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{d.total}</TableCell>
                    <TableCell className="text-center text-brand-dark font-medium">{d.completed}</TableCell>
                    <TableCell className="text-center text-accent-brand-500 font-medium">{d.failed}</TableCell>
                    <TableCell className="text-center">
                      {d.passRate > 0 ? (
                        <Badge className={d.passRate >= 50 ? "bg-brand-100 text-brand-dark hover:bg-brand-100" : "bg-accent-brand-100 text-accent-brand-700 hover:bg-accent-brand-100"}>
                          {d.passRate}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* By Department */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-title">
              <Users className="h-5 w-5 text-brand-dark" />
              สรุปตามแผนก
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.byDepartment.map((dept) => (
                <div key={dept.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{dept.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{dept.total} PIP</span>
                      {dept.passRate > 0 && (
                        <Badge className={dept.passRate >= 50 ? "bg-brand-100 text-brand-dark hover:bg-brand-100" : "bg-accent-brand-100 text-accent-brand-700 hover:bg-accent-brand-100"}>
                          ผ่าน {dept.passRate}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">ดำเนินการ</p>
                      <BarVisual value={dept.active} max={dept.total} color="bg-brand-dark" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">สำเร็จ</p>
                      <BarVisual value={dept.completed} max={dept.total} color="bg-brand-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">ไม่ผ่าน</p>
                      <BarVisual value={dept.failed} max={dept.total} color="bg-accent-brand-500" />
                    </div>
                  </div>
                  <Separator className="mt-3" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Manager */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-title">
              <BarChart3 className="h-5 w-5 text-brand-dark" />
              สรุปตามหัวหน้างาน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>หัวหน้า</TableHead>
                  <TableHead>แผนก</TableHead>
                  <TableHead className="text-center">ทั้งหมด</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-center">สำเร็จ</TableHead>
                  <TableHead className="text-center">ไม่ผ่าน</TableHead>
                  <TableHead className="text-center">อัตราผ่าน</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.byManager.map((mgr) => (
                  <TableRow key={mgr.id}>
                    <TableCell className="font-medium">{mgr.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{mgr.department}</TableCell>
                    <TableCell className="text-center">{mgr.total}</TableCell>
                    <TableCell className="text-center">{mgr.active}</TableCell>
                    <TableCell className="text-center text-brand-dark">{mgr.completed}</TableCell>
                    <TableCell className="text-center text-accent-brand-500">{mgr.failed}</TableCell>
                    <TableCell className="text-center">
                      {mgr.passRate > 0 ? (
                        <Badge className={mgr.passRate >= 50 ? "bg-brand-100 text-brand-dark hover:bg-brand-100" : "bg-accent-brand-100 text-accent-brand-700 hover:bg-accent-brand-100"}>
                          {mgr.passRate}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent PIPs */}
      <Card className="mt-6 border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-title">
            <Clock className="h-5 w-5 text-brand-dark" />
            PIP ล่าสุด
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>พนักงาน</TableHead>
                <TableHead>แผนก</TableHead>
                <TableHead>หัวหน้า</TableHead>
                <TableHead>ระยะเวลา</TableHead>
                <TableHead>วันที่สร้าง</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ผลลัพธ์</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.recentPIPs.map((pip) => (
                <TableRow key={pip.id}>
                  <TableCell className="font-medium">{pip.employeeName}</TableCell>
                  <TableCell className="text-sm">{pip.employeeDepartment}</TableCell>
                  <TableCell className="text-sm">{pip.managerName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{pip.duration} วัน</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{pip.createdAt}</TableCell>
                  <TableCell>
                    <Badge className={statusConfig[pip.status]?.className || ""}>
                      {statusConfig[pip.status]?.label || pip.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {pip.result === "passed" ? (
                      <Badge className="bg-brand-100 text-brand-dark hover:bg-brand-100">ผ่าน</Badge>
                    ) : pip.result === "failed" ? (
                      <Badge className="bg-accent-brand-100 text-accent-brand-700 hover:bg-accent-brand-100">ไม่ผ่าน</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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
