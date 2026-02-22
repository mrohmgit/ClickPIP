"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi, useApiMutation } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";

type Scope = "organization" | "department" | "role" | "individual";
type RuleType = "monitor_metric" | "alert_threshold" | "recommendation_trigger";

interface Condition {
  key: string;
  operator: string;
  value: string;
}

interface Guardrail {
  id: string;
  name: string;
  description: string;
  scope: Scope;
  ruleType: RuleType;
  conditions: Condition[];
  notificationTargets: string[];
  severity: string;
  active: boolean;
}

const scopeLabels: Record<Scope, string> = {
  organization: "ทั้งองค์กร",
  department: "แผนก",
  role: "บทบาท",
  individual: "รายบุคคล",
};

const ruleTypeLabels: Record<RuleType, string> = {
  monitor_metric: "ตรวจจับค่าวัดผล",
  alert_threshold: "แจ้งเตือนเมื่อเกินเกณฑ์",
  recommendation_trigger: "แนะนำการดำเนินการ",
};

const operatorOptions = [">", "<", ">=", "<=", "==", "!="];

// Fallback mockup data for development without DB
const mockGuardrails: Guardrail[] = [
  {
    id: "g1",
    name: "ตรวจจับการมาสายเกินเกณฑ์",
    description: "แจ้งเตือนเมื่อพนักงานมาสายเกิน 5 ครั้งต่อเดือน",
    scope: "organization",
    ruleType: "alert_threshold",
    conditions: [{ key: "late_count_monthly", operator: ">", value: "5" }],
    notificationTargets: ["HR Manager", "หัวหน้างาน"],
    severity: "critical",
    active: true,
  },
  {
    id: "g2",
    name: "ผลงานต่ำต่อเนื่อง",
    description: "ตรวจจับพนักงานที่มีคะแนนผลงานต่ำกว่า 60% เป็นเวลา 2 เดือนติดต่อกัน",
    scope: "organization",
    ruleType: "monitor_metric",
    conditions: [
      { key: "performance_score", operator: "<", value: "60" },
      { key: "consecutive_months", operator: ">=", value: "2" },
    ],
    notificationTargets: ["HR Manager"],
    severity: "warning",
    active: true,
  },
  {
    id: "g3",
    name: "แนะนำ PIP สำหรับพนักงานใหม่",
    description: "แนะนำให้จัดทำ PIP เมื่อพนักงานทดลองงานมีคะแนนต่ำกว่า 50%",
    scope: "role",
    ruleType: "recommendation_trigger",
    conditions: [
      { key: "performance_score", operator: "<", value: "50" },
      { key: "employment_type", operator: "==", value: "probation" },
    ],
    notificationTargets: ["HR Manager", "หัวหน้างาน"],
    severity: "warning",
    active: true,
  },
  {
    id: "g4",
    name: "Overtime เกินเกณฑ์",
    description: "แจ้งเตือนเมื่อพนักงานทำ OT เกิน 36 ชม./สัปดาห์ ตามกฎหมายแรงงาน",
    scope: "organization",
    ruleType: "alert_threshold",
    conditions: [{ key: "weekly_overtime_hours", operator: ">", value: "36" }],
    notificationTargets: ["HR Manager", "ผู้บริหาร"],
    severity: "critical",
    active: false,
  },
  {
    id: "g5",
    name: "คะแนนประเมินสูงผิดปกติ",
    description: "ตรวจจับเมื่อผู้จัดการให้คะแนนเฉลี่ยสูงกว่าค่าเฉลี่ยองค์กร 20%",
    scope: "department",
    ruleType: "monitor_metric",
    conditions: [{ key: "avg_score_deviation", operator: ">", value: "20" }],
    notificationTargets: ["HR Manager"],
    severity: "info",
    active: true,
  },
];

const emptyGuardrail: Omit<Guardrail, "id"> = {
  name: "",
  description: "",
  scope: "organization",
  ruleType: "alert_threshold",
  conditions: [{ key: "", operator: ">", value: "" }],
  notificationTargets: [],
  severity: "warning",
  active: true,
};

export default function GuardrailsPage() {
  const { data, loading, error, refetch } = useApi<Guardrail[]>("/api/ai-hr/guardrails");
  const { mutate: mutateCreate, loading: creating } = useApiMutation("/api/ai-hr/guardrails");

  const [guardrails, setGuardrails] = useState<Guardrail[]>(mockGuardrails);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Guardrail, "id">>(emptyGuardrail);
  const [notifInput, setNotifInput] = useState("");

  // Sync API data into local state when available
  useEffect(() => {
    if (data) {
      setGuardrails(data);
    }
  }, [data]);

  const handleToggle = async (id: string) => {
    const target = guardrails.find((g) => g.id === id);
    if (!target) return;

    // Optimistic update
    setGuardrails((prev) =>
      prev.map((g) => (g.id === id ? { ...g, active: !g.active } : g))
    );

    try {
      await fetch(`/api/ai-hr/guardrails/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !target.active }),
      });
    } catch {
      // Revert on error
      setGuardrails((prev) =>
        prev.map((g) => (g.id === id ? { ...g, active: target.active } : g))
      );
    }
  };

  const handleEdit = (guardrail: Guardrail) => {
    setEditingId(guardrail.id);
    setForm({
      name: guardrail.name,
      description: guardrail.description,
      scope: guardrail.scope,
      ruleType: guardrail.ruleType,
      conditions: [...guardrail.conditions],
      notificationTargets: [...guardrail.notificationTargets],
      severity: guardrail.severity,
      active: guardrail.active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const previous = [...guardrails];
    // Optimistic update
    setGuardrails((prev) => prev.filter((g) => g.id !== id));

    try {
      await fetch(`/api/ai-hr/guardrails/${id}`, { method: "DELETE" });
    } catch {
      // Revert on error
      setGuardrails(previous);
    }
  };

  const handleAddCondition = () => {
    setForm((prev) => ({
      ...prev,
      conditions: [...prev.conditions, { key: "", operator: ">", value: "" }],
    }));
  };

  const handleRemoveCondition = (index: number) => {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const handleConditionChange = (
    index: number,
    field: keyof Condition,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  };

  const handleAddNotificationTarget = () => {
    if (!notifInput.trim()) return;
    setForm((prev) => ({
      ...prev,
      notificationTargets: [...prev.notificationTargets, notifInput.trim()],
    }));
    setNotifInput("");
  };

  const handleRemoveNotificationTarget = (index: number) => {
    setForm((prev) => ({
      ...prev,
      notificationTargets: prev.notificationTargets.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!form.name) return;
    if (editingId) {
      // Update existing
      const previous = [...guardrails];
      setGuardrails((prev) =>
        prev.map((g) => (g.id === editingId ? { ...g, ...form } : g))
      );

      try {
        await fetch(`/api/ai-hr/guardrails/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } catch {
        setGuardrails(previous);
      }
    } else {
      // Create new
      const result = await mutateCreate({
        method: "POST",
        body: form,
        onSuccess: (data) => {
          const newGuardrail = data as Guardrail;
          if (newGuardrail?.id) {
            setGuardrails((prev) => [...prev, newGuardrail]);
          } else {
            // Fallback: add with generated id
            setGuardrails((prev) => [
              ...prev,
              { ...form, id: `g-${Date.now()}` },
            ]);
          }
        },
        onError: () => {
          // Fallback for dev without DB
          setGuardrails((prev) => [
            ...prev,
            { ...form, id: `g-${Date.now()}` },
          ]);
        },
      });
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyGuardrail);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyGuardrail);
  };

  if (loading) {
    return (
      <AppShell title="Guardrails" subtitle="ตั้งค่ากฎเกณฑ์และเงื่อนไขการแจ้งเตือนอัตโนมัติ">
        <LoadingSkeleton rows={5} />
      </AppShell>
    );
  }

  if (error && !data) {
    return (
      <AppShell title="Guardrails" subtitle="ตั้งค่ากฎเกณฑ์และเงื่อนไขการแจ้งเตือนอัตโนมัติ">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Guardrails"
      subtitle="ตั้งค่ากฎเกณฑ์และเงื่อนไขการแจ้งเตือนอัตโนมัติ"
    >
      {/* Header with Add Button */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-brand-dark" />
          <span className="text-sm text-muted-foreground">
            {guardrails.filter((g) => g.active).length} กฎเกณฑ์ที่ใช้งานอยู่ จากทั้งหมด{" "}
            {guardrails.length}
          </span>
        </div>
        {!showForm && (
          <Button
            className="bg-brand-dark hover:bg-brand-700 text-white"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm(emptyGuardrail);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            เพิ่ม Guardrail
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="border-none shadow-sm mb-6 border-2 border-dashed border-brand-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-title">
              {editingId ? "แก้ไข Guardrail" : "เพิ่ม Guardrail ใหม่"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs">ชื่อ</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="เช่น ตรวจจับการมาสายเกินเกณฑ์"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">ขอบเขต (Scope)</Label>
                <div className="mt-1 flex gap-2 flex-wrap">
                  {(Object.keys(scopeLabels) as Scope[]).map((s) => (
                    <Button
                      key={s}
                      variant={form.scope === s ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "text-xs",
                        form.scope === s
                          ? "bg-brand-dark text-white hover:bg-brand-700"
                          : ""
                      )}
                      onClick={() => setForm({ ...form, scope: s })}
                    >
                      {scopeLabels[s]}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">คำอธิบาย</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="อธิบายรายละเอียดของกฎเกณฑ์นี้"
                  className="mt-1 min-h-12"
                />
              </div>
              <div>
                <Label className="text-xs">ประเภทกฎ (Rule Type)</Label>
                <div className="mt-1 flex flex-col gap-1.5">
                  {(Object.keys(ruleTypeLabels) as RuleType[]).map((rt) => (
                    <Button
                      key={rt}
                      variant={form.ruleType === rt ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "text-xs justify-start",
                        form.ruleType === rt
                          ? "bg-brand-dark text-white hover:bg-brand-700"
                          : ""
                      )}
                      onClick={() => setForm({ ...form, ruleType: rt })}
                    >
                      {ruleTypeLabels[rt]}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">ระดับความรุนแรง</Label>
                <div className="mt-1 flex gap-2">
                  {(["critical", "warning", "info"] as const).map((sev) => (
                    <Button
                      key={sev}
                      variant={form.severity === sev ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "text-xs",
                        form.severity === sev
                          ? sev === "critical"
                            ? "bg-accent-brand-500 text-white hover:bg-accent-brand-600"
                            : sev === "warning"
                            ? "bg-brown-500 text-white hover:bg-brown-600"
                            : "bg-brand-500 text-white hover:bg-brand-600"
                          : ""
                      )}
                      onClick={() => setForm({ ...form, severity: sev })}
                    >
                      {sev === "critical"
                        ? "วิกฤต"
                        : sev === "warning"
                        ? "เตือน"
                        : "ข้อมูล"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Conditions Builder */}
              <div className="sm:col-span-2">
                <Label className="text-xs">เงื่อนไข (Conditions)</Label>
                <div className="mt-2 space-y-2">
                  {form.conditions.map((cond, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={cond.key}
                        onChange={(e) =>
                          handleConditionChange(i, "key", e.target.value)
                        }
                        placeholder="Key (เช่น late_count)"
                        className="flex-1"
                      />
                      <select
                        value={cond.operator}
                        onChange={(e) =>
                          handleConditionChange(i, "operator", e.target.value)
                        }
                        className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                      >
                        {operatorOptions.map((op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={cond.value}
                        onChange={(e) =>
                          handleConditionChange(i, "value", e.target.value)
                        }
                        placeholder="Value"
                        className="w-28"
                      />
                      {form.conditions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-accent-brand-500"
                          onClick={() => handleRemoveCondition(i)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-brand-dark"
                    onClick={handleAddCondition}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    เพิ่มเงื่อนไข
                  </Button>
                </div>
              </div>

              {/* Notification Targets */}
              <div className="sm:col-span-2">
                <Label className="text-xs">เป้าหมายการแจ้งเตือน</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    value={notifInput}
                    onChange={(e) => setNotifInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleAddNotificationTarget()
                    }
                    placeholder="เช่น HR Manager"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddNotificationTarget}
                  >
                    เพิ่ม
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.notificationTargets.map((target, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs gap-1 cursor-pointer"
                      onClick={() => handleRemoveNotificationTarget(i)}
                    >
                      {target}
                      <X className="h-2.5 w-2.5" />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="sm:col-span-2">
                <button
                  className="flex items-center gap-2"
                  onClick={() => setForm({ ...form, active: !form.active })}
                >
                  {form.active ? (
                    <ToggleRight className="h-6 w-6 text-brand-dark" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                  )}
                  <span className="text-sm">
                    {form.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                className="bg-brand-dark hover:bg-brand-700 text-white"
                onClick={handleSave}
                disabled={creating}
              >
                <Save className="mr-1 h-4 w-4" />
                {creating ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                ยกเลิก
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guardrails Table */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                <TableHead>ขอบเขต</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>เงื่อนไข</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guardrails.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{g.name}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {g.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {scopeLabels[g.scope]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">{ruleTypeLabels[g.ruleType]}</span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      {g.conditions.map((c, i) => (
                        <p key={i} className="text-[11px] text-muted-foreground">
                          {c.key} {c.operator} {c.value}
                        </p>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => handleToggle(g.id)}>
                      {g.active ? (
                        <Badge className="bg-brand-dark text-white hover:bg-brand-700 cursor-pointer">
                          เปิด
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground cursor-pointer"
                        >
                          ปิด
                        </Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-brand-dark"
                        onClick={() => handleEdit(g)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-accent-brand-500"
                        onClick={() => handleDelete(g.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
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
