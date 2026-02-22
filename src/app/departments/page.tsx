"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Target, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useApi } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";

interface Department {
  id: string;
  name: string;
  manager: string;
  employeeCount: number;
  activeKPIs: number;
  color: string;
}

// Fallback mockup data for development without DB
const mockDepartments: Department[] = [
  {
    id: "sales",
    name: "ฝ่ายขาย",
    manager: "สมชาย วงศ์สวัสดิ์",
    employeeCount: 24,
    activeKPIs: 8,
    color: "bg-brand-dark",
  },
  {
    id: "operations",
    name: "ฝ่ายปฏิบัติการ",
    manager: "วิภา ศรีสุข",
    employeeCount: 32,
    activeKPIs: 12,
    color: "bg-brand-500",
  },
  {
    id: "hr",
    name: "ฝ่ายทรัพยากรบุคคล",
    manager: "พรทิพย์ จันทร์เพ็ญ",
    employeeCount: 10,
    activeKPIs: 6,
    color: "bg-accent-brand-500",
  },
  {
    id: "marketing",
    name: "ฝ่ายการตลาด",
    manager: "ธนพล รัตนะ",
    employeeCount: 18,
    activeKPIs: 9,
    color: "bg-brown-500",
  },
  {
    id: "admin",
    name: "ฝ่ายบริหาร",
    manager: "อรุณ ประเสริฐ",
    employeeCount: 8,
    activeKPIs: 5,
    color: "bg-brand-700",
  },
];

export default function DepartmentsPage() {
  const { data, loading, error, refetch } = useApi<Department[]>("/api/departments");

  const departments = data ?? mockDepartments;

  if (loading) {
    return (
      <AppShell title="แผนกทั้งหมด" subtitle="จัดการแผนกและ KPI ประจำแผนก">
        <LoadingSkeleton rows={3} />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="แผนกทั้งหมด" subtitle="จัดการแผนกและ KPI ประจำแผนก">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }

  return (
    <AppShell title="แผนกทั้งหมด" subtitle="จัดการแผนกและ KPI ประจำแผนก">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <Link key={dept.id} href={`/departments/${dept.id}`}>
            <Card className="border-none shadow-sm transition-shadow hover:shadow-md cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2.5 ${dept.color}`}>
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-title">
                        {dept.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {dept.manager}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {dept.employeeCount} คน
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <Badge className="bg-brand-100 text-brand-dark hover:bg-brand-100">
                      {dept.activeKPIs} KPI
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
