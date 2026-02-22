"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Filter,
  Bell,
  Eye,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi, useApiMutation } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";

type Severity = "critical" | "warning" | "info";

interface Alert {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  affectedEmployee: string;
  department: string;
  recommendation: string;
  createdDate: string;
  resolved: boolean;
  read: boolean;
}

const severityConfig: Record<
  Severity,
  { label: string; icon: React.ElementType; className: string; bgClass: string }
> = {
  critical: {
    label: "วิกฤต",
    icon: AlertTriangle,
    className: "bg-accent-brand-500 text-white hover:bg-accent-brand-500",
    bgClass: "border-l-accent-brand-500",
  },
  warning: {
    label: "เตือน",
    icon: AlertCircle,
    className: "bg-brown-500 text-white hover:bg-brown-500",
    bgClass: "border-l-brown-500",
  },
  info: {
    label: "ข้อมูล",
    icon: Info,
    className: "bg-brand-500 text-white hover:bg-brand-500",
    bgClass: "border-l-brand-500",
  },
};

// Fallback mockup data for development without DB
const mockAlerts: Alert[] = [
  {
    id: "a1",
    severity: "critical",
    title: "พนักงานมาสายเกินเกณฑ์กำหนด",
    description:
      "พิชัย มงคลชัย มาสาย 8 ครั้งในเดือนนี้ ซึ่งเกินเกณฑ์กำหนดที่ 5 ครั้ง/เดือน ต้องดำเนินการตามระเบียบ",
    affectedEmployee: "พิชัย มงคลชัย",
    department: "ฝ่ายขาย",
    recommendation: "ออกหนังสือเตือนและพิจารณาเข้า PIP ทันที",
    createdDate: "22 ก.พ. 2026",
    resolved: false,
    read: false,
  },
  {
    id: "a2",
    severity: "critical",
    title: "ผลงานต่ำกว่าเกณฑ์ขั้นต่ำ 3 เดือนติดต่อกัน",
    description:
      "สมศักดิ์ พรมแดง มีคะแนนผลงานต่ำกว่า 50% เป็นเวลา 3 เดือนติดต่อกัน จำเป็นต้องดำเนินการเร่งด่วน",
    affectedEmployee: "สมศักดิ์ พรมแดง",
    department: "ฝ่ายปฏิบัติการ",
    recommendation: "จัดประชุมกับหัวหน้างานและ HR เพื่อเข้ากระบวนการ PIP ภายในสัปดาห์นี้",
    createdDate: "21 ก.พ. 2026",
    resolved: false,
    read: true,
  },
  {
    id: "a3",
    severity: "warning",
    title: "PIP ใกล้ครบกำหนด - ยังไม่บรรลุเป้าหมาย",
    description:
      "ธีรพล วัฒนา มี PIP ครบกำหนดใน 7 วัน แต่บรรลุเป้าหมายเพียง 40% จาก 3 เป้าหมาย อาจต้องพิจารณาขยายเวลาหรือดำเนินการต่อ",
    affectedEmployee: "ธีรพล วัฒนา",
    department: "ฝ่ายขาย",
    recommendation: "จัดประชุมประเมินผลก่อนครบกำหนด พร้อมพิจารณาทางเลือก",
    createdDate: "21 ก.พ. 2026",
    resolved: false,
    read: false,
  },
  {
    id: "a4",
    severity: "warning",
    title: "ภาระงานสูงเกินไป อาจส่งผลต่อ Burnout",
    description:
      "ประสิทธิ์ เจริญสุข ทำงานล่วงเวลาเฉลี่ย 4 ชั่วโมง/วัน เป็นเวลา 2 สัปดาห์ติดต่อกัน มีความเสี่ยงต่อ Burnout",
    affectedEmployee: "ประสิทธิ์ เจริญสุข",
    department: "ฝ่ายปฏิบัติการ",
    recommendation: "ทบทวนการกระจายงานในทีม พิจารณาจัดสรรทรัพยากรเพิ่มเติม",
    createdDate: "20 ก.พ. 2026",
    resolved: false,
    read: true,
  },
  {
    id: "a5",
    severity: "info",
    title: "พนักงานผ่าน PIP สำเร็จ",
    description:
      "นภา แสงจันทร์ บรรลุเป้าหมาย PIP ทุกข้อ ด้วยคะแนนเฉลี่ย 88% แนะนำให้ปิด PIP และจัดทำแผนพัฒนาต่อเนื่อง",
    affectedEmployee: "นภา แสงจันทร์",
    department: "ฝ่ายขาย",
    recommendation: "ปิด PIP อย่างเป็นทางการ และชื่นชมความพยายามของพนักงาน",
    createdDate: "19 ก.พ. 2026",
    resolved: true,
    read: true,
  },
  {
    id: "a6",
    severity: "info",
    title: "ครบกำหนดประเมินผลประจำไตรมาส",
    description:
      "ถึงกำหนดประเมินผลงานประจำไตรมาส 1/2026 สำหรับพนักงานทุกแผนก กรุณาเตรียมข้อมูลและนัดหมายหัวหน้างาน",
    affectedEmployee: "ทุกแผนก",
    department: "ทุกแผนก",
    recommendation: "ส่งแจ้งเตือนไปยังหัวหน้างานทุกแผนกเพื่อเริ่มกระบวนการประเมิน",
    createdDate: "18 ก.พ. 2026",
    resolved: false,
    read: true,
  },
];

export default function AIAlertsPage() {
  const { data, loading, error, refetch } = useApi<Alert[]>("/api/ai-hr/alerts");
  const { mutate, loading: mutating } = useApiMutation("/api/ai-hr/alerts");

  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [filterSeverity, setFilterSeverity] = useState<Severity | "all">("all");
  const [filterResolved, setFilterResolved] = useState<"all" | "active" | "resolved">("all");

  // Sync API data into local state when available
  useEffect(() => {
    if (data) {
      setAlerts(data);
    }
  }, [data]);

  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity !== "all" && alert.severity !== filterSeverity) return false;
    if (filterResolved === "active" && alert.resolved) return false;
    if (filterResolved === "resolved" && !alert.resolved) return false;
    return true;
  });

  const criticalCount = alerts.filter((a) => a.severity === "critical" && !a.resolved).length;
  const warningCount = alerts.filter((a) => a.severity === "warning" && !a.resolved).length;
  const infoCount = alerts.filter((a) => a.severity === "info" && !a.resolved).length;

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
    await mutate({
      method: "PATCH",
      body: { id, action: "markRead" },
      onError: () => {
        // Revert on error
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, read: false } : a))
        );
      },
    });
  };

  const handleMarkAsResolved = async (id: string) => {
    // Optimistic update
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true, read: true } : a))
    );
    await mutate({
      method: "PATCH",
      body: { id, action: "markResolved" },
      onError: () => {
        // Revert on error
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, resolved: false } : a))
        );
      },
    });
  };

  if (loading) {
    return (
      <AppShell title="การแจ้งเตือนเชิงรุก" subtitle="AI ตรวจจับและแจ้งเตือนสิ่งผิดปกติอัตโนมัติ">
        <LoadingSkeleton rows={5} />
      </AppShell>
    );
  }

  if (error && !data) {
    return (
      <AppShell title="การแจ้งเตือนเชิงรุก" subtitle="AI ตรวจจับและแจ้งเตือนสิ่งผิดปกติอัตโนมัติ">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }

  return (
    <AppShell title="การแจ้งเตือนเชิงรุก" subtitle="AI ตรวจจับและแจ้งเตือนสิ่งผิดปกติอัตโนมัติ">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">แจ้งเตือนวิกฤต</p>
                <p className="mt-1 text-3xl font-bold font-title text-accent-brand-500">
                  {criticalCount}
                </p>
              </div>
              <div className="rounded-lg bg-accent-brand-500 p-2.5">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">คำเตือน</p>
                <p className="mt-1 text-3xl font-bold font-title text-brown-600">
                  {warningCount}
                </p>
              </div>
              <div className="rounded-lg bg-brown-500 p-2.5">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ข้อมูลทั่วไป</p>
                <p className="mt-1 text-3xl font-bold font-title text-brand-500">
                  {infoCount}
                </p>
              </div>
              <div className="rounded-lg bg-brand-500 p-2.5">
                <Info className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">ระดับ:</span>
        </div>
        {(["all", "critical", "warning", "info"] as const).map((sev) => (
          <Button
            key={sev}
            variant={filterSeverity === sev ? "default" : "outline"}
            size="sm"
            className={cn(
              "text-xs h-7",
              filterSeverity === sev
                ? "bg-brand-dark text-white hover:bg-brand-700"
                : ""
            )}
            onClick={() => setFilterSeverity(sev)}
          >
            {sev === "all" ? "ทั้งหมด" : severityConfig[sev].label}
          </Button>
        ))}

        <div className="h-4 w-px bg-border" />

        <span className="text-sm text-muted-foreground">สถานะ:</span>
        {(["all", "active", "resolved"] as const).map((status) => (
          <Button
            key={status}
            variant={filterResolved === status ? "default" : "outline"}
            size="sm"
            className={cn(
              "text-xs h-7",
              filterResolved === status
                ? "bg-brand-dark text-white hover:bg-brand-700"
                : ""
            )}
            onClick={() => setFilterResolved(status)}
          >
            {status === "all"
              ? "ทั้งหมด"
              : status === "active"
              ? "ยังดำเนินการ"
              : "แก้ไขแล้ว"}
          </Button>
        ))}
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => {
          const config = severityConfig[alert.severity];
          const SeverityIcon = config.icon;

          return (
            <Card
              key={alert.id}
              className={cn(
                "border-none shadow-sm border-l-4",
                config.bgClass,
                !alert.read && "bg-brand-50/30"
              )}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "shrink-0 rounded-lg p-2",
                      alert.severity === "critical"
                        ? "bg-accent-brand-100"
                        : alert.severity === "warning"
                        ? "bg-brown-100"
                        : "bg-brand-100"
                    )}
                  >
                    <SeverityIcon
                      className={cn(
                        "h-5 w-5",
                        alert.severity === "critical"
                          ? "text-accent-brand-500"
                          : alert.severity === "warning"
                          ? "text-brown-600"
                          : "text-brand-500"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm">{alert.title}</h3>
                          <Badge className={config.className}>
                            {config.label}
                          </Badge>
                          {alert.resolved && (
                            <Badge className="bg-brand-dark text-white hover:bg-brand-dark">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              แก้ไขแล้ว
                            </Badge>
                          )}
                          {!alert.read && (
                            <span className="h-2 w-2 rounded-full bg-accent-brand-500" />
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {alert.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                        <Clock className="h-3 w-3" />
                        {alert.createdDate}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px]">
                        {alert.affectedEmployee}
                      </Badge>
                      <Badge className="bg-brand-100 text-brand-dark hover:bg-brand-100 text-[10px]">
                        {alert.department}
                      </Badge>
                    </div>

                    {/* Recommendation */}
                    <div className="mt-3 rounded-lg bg-muted/50 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">
                        คำแนะนำ:
                      </p>
                      <p className="text-xs">{alert.recommendation}</p>
                    </div>

                    {/* Actions */}
                    {!alert.resolved && (
                      <div className="mt-3 flex gap-2">
                        {!alert.read && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => handleMarkAsRead(alert.id)}
                            disabled={mutating}
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            อ่านแล้ว
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="text-xs h-7 bg-brand-dark hover:bg-brand-700 text-white"
                          onClick={() => handleMarkAsResolved(alert.id)}
                          disabled={mutating}
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          แก้ไขแล้ว
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">
              ไม่พบการแจ้งเตือนตามเงื่อนไขที่เลือก
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
