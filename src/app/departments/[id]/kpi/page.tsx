"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  ArrowLeft,
  Save,
  Trash2,
  Target,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi, useApiMutation } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";

interface KPIFactor {
  id: string;
  name: string;
  description: string;
  weight: number;
  targetValue: string;
  dataSource: "manual" | "attendance" | "tasks";
}

interface KPICategory {
  id: string;
  name: string;
  factors: KPIFactor[];
}

interface DepartmentKPIData {
  deptName: string;
  categories: KPICategory[];
}

// Fallback mockup data for development without DB
const fallbackDeptNames: Record<string, string> = {
  sales: "ฝ่ายขาย",
  operations: "ฝ่ายปฏิบัติการ",
  hr: "ฝ่ายทรัพยากรบุคคล",
  marketing: "ฝ่ายการตลาด",
  admin: "ฝ่ายบริหาร",
};

const fallbackCategories: KPICategory[] = [
  {
    id: "work-output",
    name: "ผลงาน (Work Output)",
    factors: [
      {
        id: "wo-1",
        name: "ยอดขายรายเดือน",
        description: "ยอดขายรวมต่อเดือนเทียบกับเป้าหมาย",
        weight: 40,
        targetValue: "500,000 บาท",
        dataSource: "tasks",
      },
      {
        id: "wo-2",
        name: "จำนวนลูกค้าใหม่",
        description: "จำนวนลูกค้าใหม่ที่เปิดบัญชีต่อเดือน",
        weight: 30,
        targetValue: "10 ราย",
        dataSource: "manual",
      },
      {
        id: "wo-3",
        name: "อัตราการปิดดีล",
        description: "เปอร์เซ็นต์การปิดดีลจากลีดทั้งหมด",
        weight: 30,
        targetValue: "25%",
        dataSource: "tasks",
      },
    ],
  },
  {
    id: "skills",
    name: "ทักษะ (Skills)",
    factors: [
      {
        id: "sk-1",
        name: "ความรู้ผลิตภัณฑ์",
        description: "ผลคะแนนทดสอบความรู้ผลิตภัณฑ์ประจำไตรมาส",
        weight: 50,
        targetValue: "80%",
        dataSource: "manual",
      },
      {
        id: "sk-2",
        name: "ทักษะการนำเสนอ",
        description: "คะแนนประเมินจากหัวหน้างาน",
        weight: 50,
        targetValue: "4/5",
        dataSource: "manual",
      },
    ],
  },
  {
    id: "behavior",
    name: "พฤติกรรม (Behavior)",
    factors: [
      {
        id: "bh-1",
        name: "การทำงานเป็นทีม",
        description: "คะแนนประเมินจากเพื่อนร่วมงาน (360 องศา)",
        weight: 50,
        targetValue: "4/5",
        dataSource: "manual",
      },
      {
        id: "bh-2",
        name: "ความรับผิดชอบ",
        description: "ส่งรายงานตรงเวลา ปฏิบัติตามข้อตกลง",
        weight: 50,
        targetValue: "90%",
        dataSource: "tasks",
      },
    ],
  },
  {
    id: "attendance",
    name: "การเข้างาน (Attendance)",
    factors: [
      {
        id: "at-1",
        name: "อัตราการเข้างาน",
        description: "เปอร์เซ็นต์วันที่มาทำงานต่อเดือน",
        weight: 60,
        targetValue: "95%",
        dataSource: "attendance",
      },
      {
        id: "at-2",
        name: "การมาทำงานตรงเวลา",
        description: "เปอร์เซ็นต์วันที่ไม่สาย",
        weight: 40,
        targetValue: "90%",
        dataSource: "attendance",
      },
    ],
  },
];

const dataSourceLabels: Record<string, string> = {
  manual: "บันทึกด้วยมือ",
  attendance: "ระบบลงเวลา",
  tasks: "ระบบงาน",
};

const dataSourceColors: Record<string, string> = {
  manual: "bg-brown-200 text-brown-800 hover:bg-brown-200",
  attendance: "bg-brand-100 text-brand-dark hover:bg-brand-100",
  tasks: "bg-accent-brand-100 text-accent-brand-700 hover:bg-accent-brand-100",
};

export default function DepartmentKPIPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, loading, error, refetch } = useApi<DepartmentKPIData>(`/api/departments/${id}`);
  const { mutate, loading: saving } = useApiMutation(`/api/departments/${id}`);

  const deptName = data?.deptName ?? fallbackDeptNames[id] ?? "แผนก";

  const [categories, setCategories] = useState<KPICategory[]>(fallbackCategories);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["work-output"])
  );
  const [editingFactor, setEditingFactor] = useState<string | null>(null);
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);

  // New factor form state
  const [newFactorName, setNewFactorName] = useState("");
  const [newFactorDesc, setNewFactorDesc] = useState("");
  const [newFactorWeight, setNewFactorWeight] = useState("");
  const [newFactorTarget, setNewFactorTarget] = useState("");
  const [newFactorSource, setNewFactorSource] = useState<"manual" | "attendance" | "tasks">("manual");

  // Sync API data into local state when available
  useEffect(() => {
    if (data?.categories) {
      setCategories(data.categories);
    }
  }, [data]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const getTotalWeight = (factors: KPIFactor[]) =>
    factors.reduce((sum, f) => sum + f.weight, 0);

  const handleAddFactor = (catId: string) => {
    if (!newFactorName || !newFactorWeight) return;
    const weight = parseInt(newFactorWeight, 10);
    if (isNaN(weight)) return;

    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          factors: [
            ...cat.factors,
            {
              id: `${catId}-${Date.now()}`,
              name: newFactorName,
              description: newFactorDesc,
              weight,
              targetValue: newFactorTarget,
              dataSource: newFactorSource,
            },
          ],
        };
      })
    );
    resetNewFactorForm();
  };

  const handleDeleteFactor = (catId: string, factorId: string) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          factors: cat.factors.filter((f) => f.id !== factorId),
        };
      })
    );
  };

  const resetNewFactorForm = () => {
    setAddingToCategory(null);
    setNewFactorName("");
    setNewFactorDesc("");
    setNewFactorWeight("");
    setNewFactorTarget("");
    setNewFactorSource("manual");
  };

  const handleSave = async () => {
    await mutate({
      method: "PUT",
      body: { categories },
      onSuccess: () => {
        refetch();
      },
      onError: (err) => {
        alert(`เกิดข้อผิดพลาดในการบันทึก: ${err}`);
      },
    });
  };

  if (loading) {
    return (
      <AppShell title="กำลังโหลด..." subtitle="">
        <LoadingSkeleton rows={5} />
      </AppShell>
    );
  }

  if (error && !data) {
    return (
      <AppShell title="เกิดข้อผิดพลาด" subtitle="">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`ตั้งค่า KPI - ${deptName}`}
      subtitle="กำหนดปัจจัยการวัดผลและน้ำหนักแต่ละหมวด"
    >
      {/* Back Link */}
      <div className="mb-4">
        <Link href={`/departments/${id}`}>
          <Button variant="ghost" size="sm" className="text-brand-dark">
            <ArrowLeft className="mr-1 h-4 w-4" />
            กลับไปหน้าแผนก
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => {
          const isExpanded = expandedCategories.has(cat.id);
          const totalWeight = getTotalWeight(cat.factors);
          const isValid = totalWeight === 100;

          return (
            <Card key={cat.id} className="border-none shadow-sm">
              <CardHeader
                className="pb-3 cursor-pointer"
                onClick={() => toggleCategory(cat.id)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-title flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-brand-dark" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-brand-dark" />
                    )}
                    <Target className="h-4 w-4 text-brand-dark" />
                    {cat.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        isValid
                          ? "bg-brand-dark text-white hover:bg-brand-dark"
                          : "bg-accent-brand-500 text-white hover:bg-accent-brand-500"
                      }
                    >
                      น้ำหนักรวม: {totalWeight}%
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {cat.factors.length} ปัจจัย
                    </span>
                  </div>
                </div>

                {/* Weight Visualization */}
                <div className="mt-2 h-2 rounded-full bg-brand-100 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isValid ? "bg-brand-dark" : "bg-accent-brand-500"
                    }`}
                    style={{ width: `${Math.min(totalWeight, 100)}%` }}
                  />
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {cat.factors.map((factor) => (
                      <div
                        key={factor.id}
                        className="flex items-start justify-between rounded-lg border bg-white p-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{factor.name}</h4>
                            <Badge className={dataSourceColors[factor.dataSource]}>
                              {dataSourceLabels[factor.dataSource]}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {factor.description}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-xs">
                            <span className="text-muted-foreground">
                              น้ำหนัก:{" "}
                              <span className="font-bold text-brand-dark">
                                {factor.weight}%
                              </span>
                            </span>
                            <span className="text-muted-foreground">
                              เป้าหมาย:{" "}
                              <span className="font-medium">{factor.targetValue}</span>
                            </span>
                          </div>
                          {/* Individual weight bar */}
                          <div className="mt-1.5 h-1.5 w-32 rounded-full bg-brand-100 overflow-hidden">
                            <div
                              className="h-1.5 rounded-full bg-brand-500 transition-all"
                              style={{ width: `${factor.weight}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground hover:text-brand-dark"
                            onClick={() =>
                              setEditingFactor(
                                editingFactor === factor.id ? null : factor.id
                              )
                            }
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground hover:text-accent-brand-500"
                            onClick={() => handleDeleteFactor(cat.id, factor.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Factor Form */}
                  {addingToCategory === cat.id ? (
                    <div className="mt-4 rounded-lg border-2 border-dashed border-brand-300 bg-brand-50/50 p-4">
                      <h4 className="text-sm font-medium mb-3">เพิ่มปัจจัยใหม่</h4>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <Label className="text-xs">ชื่อปัจจัย</Label>
                          <Input
                            value={newFactorName}
                            onChange={(e) => setNewFactorName(e.target.value)}
                            placeholder="เช่น ยอดขายรายเดือน"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">น้ำหนัก (%)</Label>
                          <Input
                            type="number"
                            value={newFactorWeight}
                            onChange={(e) => setNewFactorWeight(e.target.value)}
                            placeholder="เช่น 30"
                            className="mt-1"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label className="text-xs">คำอธิบาย</Label>
                          <Textarea
                            value={newFactorDesc}
                            onChange={(e) => setNewFactorDesc(e.target.value)}
                            placeholder="อธิบายรายละเอียดของปัจจัยการวัดผล"
                            className="mt-1 min-h-12"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">ค่าเป้าหมาย</Label>
                          <Input
                            value={newFactorTarget}
                            onChange={(e) => setNewFactorTarget(e.target.value)}
                            placeholder="เช่น 500,000 บาท"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">แหล่งข้อมูล</Label>
                          <div className="mt-1 flex gap-2">
                            {(["manual", "attendance", "tasks"] as const).map((src) => (
                              <Button
                                key={src}
                                variant={newFactorSource === src ? "default" : "outline"}
                                size="sm"
                                className={
                                  newFactorSource === src
                                    ? "bg-brand-dark text-white hover:bg-brand-700"
                                    : ""
                                }
                                onClick={() => setNewFactorSource(src)}
                              >
                                {dataSourceLabels[src]}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          className="bg-brand-dark hover:bg-brand-700 text-white"
                          onClick={() => handleAddFactor(cat.id)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          เพิ่ม
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetNewFactorForm}
                        >
                          ยกเลิก
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 w-full border border-dashed text-brand-dark hover:bg-brand-50"
                      onClick={() => setAddingToCategory(cat.id)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      เพิ่มปัจจัย
                    </Button>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <Button
          className="bg-brand-dark hover:bg-brand-700 text-white"
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="mr-1 h-4 w-4" />
          {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </Button>
      </div>
    </AppShell>
  );
}
