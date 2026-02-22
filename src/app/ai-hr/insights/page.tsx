"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3,
  AlertTriangle,
  Scale,
  Users,
  ArrowRight,
  Filter,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";

type InsightType =
  | "performance"
  | "attendance"
  | "workload"
  | "pre-pip"
  | "calibration";

type Severity = "critical" | "warning" | "info";

interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  severity: Severity;
  affectedEmployees: string[];
  department: string;
  recommendation: string;
  metric?: string;
  trend?: "up" | "down" | "flat";
}

const insightTypeConfig: Record<
  InsightType,
  { label: string; icon: React.ElementType; color: string }
> = {
  performance: {
    label: "แนวโน้มผลงาน",
    icon: TrendingUp,
    color: "bg-brand-dark",
  },
  attendance: {
    label: "รูปแบบการเข้างาน",
    icon: Clock,
    color: "bg-brand-500",
  },
  workload: {
    label: "การกระจายงาน",
    icon: BarChart3,
    color: "bg-brown-500",
  },
  "pre-pip": {
    label: "เตือนก่อน PIP",
    icon: AlertTriangle,
    color: "bg-accent-brand-500",
  },
  calibration: {
    label: "สอบเทียบการประเมิน",
    icon: Scale,
    color: "bg-brand-700",
  },
};

const severityConfig: Record<Severity, { label: string; className: string }> = {
  critical: {
    label: "วิกฤต",
    className: "bg-accent-brand-500 text-white hover:bg-accent-brand-500",
  },
  warning: {
    label: "เตือน",
    className: "bg-brown-500 text-white hover:bg-brown-500",
  },
  info: {
    label: "ข้อมูล",
    className: "bg-brand-500 text-white hover:bg-brand-500",
  },
};

// Fallback mockup data for development without DB
const mockInsights: Insight[] = [
  {
    id: "i1",
    type: "performance",
    title: "ฝ่ายขายมีคะแนนผลงานลดลง 15% ในไตรมาสนี้",
    description:
      "เปรียบเทียบคะแนนผลงานเฉลี่ยของฝ่ายขายกับไตรมาสก่อน พบว่าคะแนนลดลงจาก 82% เหลือ 70% โดยเฉพาะหมวดยอดขายใหม่และการรักษาลูกค้า",
    severity: "warning",
    affectedEmployees: ["กิตติ สุขสมบูรณ์", "พิชัย มงคลชัย", "ธีรพล วัฒนา"],
    department: "ฝ่ายขาย",
    recommendation:
      "แนะนำให้จัดประชุมทีมเพื่อวิเคราะห์สาเหตุ และพิจารณาปรับเป้าหมายให้สอดคล้องกับสถานการณ์ตลาด",
    metric: "-15%",
    trend: "down",
  },
  {
    id: "i2",
    type: "attendance",
    title: "พบความสัมพันธ์ระหว่างการมาสายกับผลงานต่ำ",
    description:
      "พนักงาน 4 คนที่มาสายเฉลี่ยมากกว่า 3 ครั้ง/สัปดาห์ มีคะแนนผลงานต่ำกว่าเกณฑ์เฉลี่ย 20% ส่วนใหญ่อยู่ในฝ่ายปฏิบัติการ",
    severity: "critical",
    affectedEmployees: [
      "สมศักดิ์ พรมแดง",
      "พิชัย มงคลชัย",
      "ธีรพล วัฒนา",
      "อนุชา สิทธิ์ศรี",
    ],
    department: "หลายแผนก",
    recommendation:
      "ดำเนินการพูดคุยรายบุคคลเพื่อหาสาเหตุ และพิจารณาเข้า PIP หากไม่มีการปรับปรุงใน 2 สัปดาห์",
    metric: "4 คน",
    trend: "up",
  },
  {
    id: "i3",
    type: "workload",
    title: "ฝ่ายปฏิบัติการมีภาระงานสูงกว่าแผนกอื่น 40%",
    description:
      "จากข้อมูลระบบงาน ฝ่ายปฏิบัติการมีจำนวนงานเฉลี่ยต่อคน 28 ชิ้น/สัปดาห์ ในขณะที่แผนกอื่นเฉลี่ย 20 ชิ้น/สัปดาห์",
    severity: "warning",
    affectedEmployees: ["ประสิทธิ์ เจริญสุข", "รัตนา สมบัติดี"],
    department: "ฝ่ายปฏิบัติการ",
    recommendation:
      "พิจารณาจ้างพนักงานเพิ่มหรือจัดสรรงานบางส่วนให้แผนกอื่นช่วย",
    metric: "+40%",
    trend: "up",
  },
  {
    id: "i4",
    type: "pre-pip",
    title: "พนักงาน 2 คนมีแนวโน้มผลงานลดลงต่อเนื่อง",
    description:
      "ผลงานลดลง 3 เดือนติดต่อกัน คะแนนรวมต่ำกว่า 60% มีความเสี่ยงสูงที่จะต้องเข้า PIP หากไม่ได้รับการดูแล",
    severity: "critical",
    affectedEmployees: ["พิชัย มงคลชัย", "สมศักดิ์ พรมแดง"],
    department: "หลายแผนก",
    recommendation:
      "แนะนำให้หัวหน้างานจัด 1-on-1 ภายในสัปดาห์นี้ พร้อมวางแผนพัฒนาเบื้องต้นก่อนพิจารณา PIP",
    metric: "2 คน",
    trend: "down",
  },
  {
    id: "i5",
    type: "calibration",
    title: "ผู้จัดการฝ่ายบริหารให้คะแนนสูงกว่าค่าเฉลี่ย 25%",
    description:
      "คะแนนประเมินเฉลี่ยของฝ่ายบริหารอยู่ที่ 92% ในขณะที่ค่าเฉลี่ยทั้งองค์กรอยู่ที่ 78% อาจบ่งชี้ว่าเกณฑ์การประเมินไม่เข้มงวดเพียงพอ",
    severity: "info",
    affectedEmployees: ["อรุณ ประเสริฐ"],
    department: "ฝ่ายบริหาร",
    recommendation:
      "แนะนำให้จัดการสอบเทียบ (Calibration Session) ระหว่างผู้จัดการทุกแผนก",
    metric: "+25%",
    trend: "up",
  },
  {
    id: "i6",
    type: "performance",
    title: "ฝ่ายทรัพยากรบุคคลมีผลงานเพิ่มขึ้นอย่างต่อเนื่อง",
    description:
      "คะแนนเฉลี่ยเพิ่มขึ้นจาก 78% เป็น 85% ในช่วง 3 เดือนที่ผ่านมา โดยเฉพาะหมวดการสรรหาและการพัฒนาบุคลากร",
    severity: "info",
    affectedEmployees: ["วรรณา สุขใจ", "ชาติชาย กล้าหาญ"],
    department: "ฝ่ายทรัพยากรบุคคล",
    recommendation:
      "ศึกษาแนวปฏิบัติของแผนกนี้เพื่อนำไปใช้กับแผนกอื่น (Best Practice Sharing)",
    metric: "+7%",
    trend: "up",
  },
];

const departments = [
  "ทั้งหมด",
  "ฝ่ายขาย",
  "ฝ่ายปฏิบัติการ",
  "ฝ่ายทรัพยากรบุคคล",
  "ฝ่ายการตลาด",
  "ฝ่ายบริหาร",
  "หลายแผนก",
];

export default function AIInsightsPage() {
  const { data, loading, error, refetch } = useApi<Insight[]>("/api/ai-hr/insights");

  const insights = data ?? mockInsights;

  const [filterType, setFilterType] = useState<InsightType | "all">("all");
  const [filterDept, setFilterDept] = useState("ทั้งหมด");

  const filteredInsights = insights.filter((insight) => {
    if (filterType !== "all" && insight.type !== filterType) return false;
    if (filterDept !== "ทั้งหมด" && insight.department !== filterDept) return false;
    return true;
  });

  if (loading) {
    return (
      <AppShell title="AI Insights" subtitle="ข้อมูลเชิงลึกจาก AI วิเคราะห์ข้อมูลพนักงาน">
        <LoadingSkeleton rows={5} />
      </AppShell>
    );
  }

  if (error && !data) {
    return (
      <AppShell title="AI Insights" subtitle="ข้อมูลเชิงลึกจาก AI วิเคราะห์ข้อมูลพนักงาน">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="AI Insights"
      subtitle="ข้อมูลเชิงลึกจาก AI วิเคราะห์ข้อมูลพนักงาน"
    >
      {/* Insight Type Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 mb-6">
        {(Object.entries(insightTypeConfig) as [InsightType, typeof insightTypeConfig[InsightType]][]).map(
          ([type, config]) => {
            const count = insights.filter((i) => i.type === type).length;
            const Icon = config.icon;
            return (
              <button
                key={type}
                onClick={() =>
                  setFilterType(filterType === type ? "all" : type)
                }
                className={cn(
                  "rounded-xl p-4 text-left transition-all",
                  filterType === type
                    ? "ring-2 ring-brand-dark bg-white shadow-md"
                    : "bg-white shadow-sm hover:shadow-md"
                )}
              >
                <div className={`inline-flex rounded-lg p-2 ${config.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {config.label}
                </p>
                <p className="text-xl font-bold font-title">{count}</p>
              </button>
            );
          }
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">กรองตามแผนก:</span>
        </div>
        {departments.map((dept) => (
          <Button
            key={dept}
            variant={filterDept === dept ? "default" : "outline"}
            size="sm"
            className={cn(
              "text-xs h-7",
              filterDept === dept
                ? "bg-brand-dark text-white hover:bg-brand-700"
                : ""
            )}
            onClick={() => setFilterDept(dept)}
          >
            {dept}
          </Button>
        ))}
      </div>

      {/* Insight Cards */}
      <div className="space-y-4">
        {filteredInsights.map((insight) => {
          const typeConfig = insightTypeConfig[insight.type];
          const TypeIcon = typeConfig.icon;

          return (
            <Card key={insight.id} className="border-none shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 rounded-lg p-2.5 ${typeConfig.color}`}>
                    <TypeIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm">
                            {insight.title}
                          </h3>
                          <Badge
                            className={severityConfig[insight.severity].className}
                          >
                            {severityConfig[insight.severity].label}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>
                      {insight.metric && (
                        <div className="shrink-0 text-right">
                          <span
                            className={cn(
                              "text-lg font-bold font-title",
                              insight.trend === "down"
                                ? "text-accent-brand-500"
                                : insight.trend === "up" &&
                                  insight.severity !== "info"
                                ? "text-accent-brand-500"
                                : "text-brand-dark"
                            )}
                          >
                            {insight.metric}
                          </span>
                          <div className="flex items-center justify-end gap-1">
                            {insight.trend === "up" ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Affected Employees */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        พนักงานที่เกี่ยวข้อง:
                      </span>
                      {insight.affectedEmployees.map((emp, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-[10px] h-5"
                        >
                          {emp}
                        </Badge>
                      ))}
                    </div>

                    {/* Department */}
                    <div className="mt-2">
                      <Badge className="bg-brand-100 text-brand-dark hover:bg-brand-100 text-[10px]">
                        {insight.department}
                      </Badge>
                    </div>

                    {/* Recommendation */}
                    <div className="mt-3 rounded-lg bg-brand-50 p-3">
                      <p className="text-xs font-medium text-brand-dark mb-1">
                        คำแนะนำ:
                      </p>
                      <p className="text-xs text-brand-800">
                        {insight.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredInsights.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">
              ไม่พบข้อมูลเชิงลึกตามเงื่อนไขที่เลือก
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
