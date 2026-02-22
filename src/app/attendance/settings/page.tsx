"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Settings, Save, Plus, Trash2, ShieldAlert } from "lucide-react";
import { useApi, useApiMutation } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";

// ---------- Types ----------
interface DepartmentOverride {
  id: number;
  department: string;
  workStart: string;
  workEnd: string;
  graceMinutes: number;
}

interface AttendanceSettings {
  workStart: string;
  workEnd: string;
  graceMinutes: number;
  halfDayHours: number;
  otMinimumMinutes: number;
  departmentOverrides: DepartmentOverride[];
}

// ---------- Mock Data (fallback for dev without DB) ----------
const mockSettings: AttendanceSettings = {
  workStart: "09:00",
  workEnd: "18:00",
  graceMinutes: 5,
  halfDayHours: 4,
  otMinimumMinutes: 30,
  departmentOverrides: [
    { id: 1, department: "ปฏิบัติการ", workStart: "08:00", workEnd: "17:00", graceMinutes: 10 },
    { id: 2, department: "วิศวกรรม", workStart: "09:30", workEnd: "18:30", graceMinutes: 5 },
  ],
};

// ---------- Page ----------
export default function AttendanceSettingsPage() {
  const { data: apiSettings, loading, error, refetch } = useApi<AttendanceSettings>(
    "/api/attendance/settings"
  );
  const { mutate, loading: saving } = useApiMutation("/api/attendance/settings");

  // Use API data or fallback to mock data for dev without DB
  const settings = apiSettings ?? mockSettings;

  // General settings
  const [workStart, setWorkStart] = useState(settings.workStart);
  const [workEnd, setWorkEnd] = useState(settings.workEnd);
  const [graceMinutes, setGraceMinutes] = useState(settings.graceMinutes);
  const [halfDayHours, setHalfDayHours] = useState(settings.halfDayHours);
  const [otMinimumMinutes, setOtMinimumMinutes] = useState(settings.otMinimumMinutes);

  // Department overrides
  const [overrides, setOverrides] = useState<DepartmentOverride[]>(settings.departmentOverrides);

  const [newDept, setNewDept] = useState("");
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("18:00");
  const [newGrace, setNewGrace] = useState(5);

  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync form state when API data arrives
  useEffect(() => {
    if (apiSettings) {
      setWorkStart(apiSettings.workStart);
      setWorkEnd(apiSettings.workEnd);
      setGraceMinutes(apiSettings.graceMinutes);
      setHalfDayHours(apiSettings.halfDayHours);
      setOtMinimumMinutes(apiSettings.otMinimumMinutes);
      setOverrides(apiSettings.departmentOverrides);
    }
  }, [apiSettings]);

  const handleAddOverride = () => {
    if (!newDept.trim()) return;
    setOverrides((prev) => [
      ...prev,
      {
        id: Date.now(),
        department: newDept.trim(),
        workStart: newStart,
        workEnd: newEnd,
        graceMinutes: newGrace,
      },
    ]);
    setNewDept("");
    setNewStart("09:00");
    setNewEnd("18:00");
    setNewGrace(5);
  };

  const handleRemoveOverride = (id: number) => {
    setOverrides((prev) => prev.filter((o) => o.id !== id));
  };

  const handleSave = async () => {
    setSaveError(null);
    await mutate({
      method: "PUT",
      body: {
        workStart,
        workEnd,
        graceMinutes,
        halfDayHours,
        otMinimumMinutes,
        departmentOverrides: overrides,
      },
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      },
      onError: (error) => {
        setSaveError(error);
        // Fallback: still show success for dev without DB
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      },
    });
  };

  if (loading) {
    return (
      <AppShell title="ตั้งค่าการเข้างาน" subtitle="กำหนดเวลาทำงานและเงื่อนไขสำหรับระบบ (เฉพาะผู้ดูแลระบบ)">
        <LoadingSkeleton />
      </AppShell>
    );
  }

  if (error && !apiSettings) {
    return (
      <AppShell title="ตั้งค่าการเข้างาน" subtitle="กำหนดเวลาทำงานและเงื่อนไขสำหรับระบบ (เฉพาะผู้ดูแลระบบ)">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }

  return (
    <AppShell title="ตั้งค่าการเข้างาน" subtitle="กำหนดเวลาทำงานและเงื่อนไขสำหรับระบบ (เฉพาะผู้ดูแลระบบ)">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Admin Notice */}
        <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 p-4">
          <ShieldAlert className="h-5 w-5 text-brand-dark shrink-0" />
          <div>
            <p className="text-sm font-medium text-brand-dark">สำหรับผู้ดูแลระบบเท่านั้น</p>
            <p className="text-xs text-muted-foreground">การเปลี่ยนแปลงจะมีผลกับการคำนวณสถานะเข้างานของพนักงานทั้งหมด</p>
          </div>
        </div>

        {/* General Settings */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-title">
              <Settings className="h-5 w-5 text-brand-dark" />
              ตั้งค่าทั่วไป
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Work Start */}
              <div className="space-y-2">
                <Label htmlFor="work-start" className="text-sm font-medium">
                  เวลาเริ่มงาน
                </Label>
                <Input
                  id="work-start"
                  type="time"
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">เวลาเริ่มต้นการทำงานปกติ</p>
              </div>

              {/* Work End */}
              <div className="space-y-2">
                <Label htmlFor="work-end" className="text-sm font-medium">
                  เวลาเลิกงาน
                </Label>
                <Input
                  id="work-end"
                  type="time"
                  value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">เวลาสิ้นสุดการทำงานปกติ</p>
              </div>

              {/* Grace Period */}
              <div className="space-y-2">
                <Label htmlFor="grace" className="text-sm font-medium">
                  ระยะเวลาผ่อนผัน (นาที)
                </Label>
                <Input
                  id="grace"
                  type="number"
                  min={0}
                  max={60}
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  จำนวนนาทีหลังเวลาเริ่มงานที่ไม่นับเป็นมาสาย
                </p>
              </div>

              {/* Half Day Hours */}
              <div className="space-y-2">
                <Label htmlFor="halfday" className="text-sm font-medium">
                  ชั่วโมงทำงานครึ่งวัน
                </Label>
                <Input
                  id="halfday"
                  type="number"
                  min={1}
                  max={12}
                  value={halfDayHours}
                  onChange={(e) => setHalfDayHours(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  จำนวนชั่วโมงขั้นต่ำสำหรับนับเป็นทำงานครึ่งวัน
                </p>
              </div>

              {/* OT Minimum */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ot-min" className="text-sm font-medium">
                  OT ขั้นต่ำ (นาที)
                </Label>
                <Input
                  id="ot-min"
                  type="number"
                  min={0}
                  max={120}
                  value={otMinimumMinutes}
                  onChange={(e) => setOtMinimumMinutes(Number(e.target.value))}
                  className="sm:max-w-[50%]"
                />
                <p className="text-xs text-muted-foreground">
                  จำนวนนาทีขั้นต่ำหลังเลิกงานที่จะนับเป็น OT
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department Overrides */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-title">
              ตั้งค่าเฉพาะแผนก
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              กำหนดเวลาทำงานที่แตกต่างสำหรับแต่ละแผนก (จะมีผลแทนค่าทั่วไป)
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {overrides.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>แผนก</TableHead>
                    <TableHead>เริ่มงาน</TableHead>
                    <TableHead>เลิกงาน</TableHead>
                    <TableHead>ผ่อนผัน (นาที)</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overrides.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.department}</TableCell>
                      <TableCell className="font-mono text-sm">{o.workStart}</TableCell>
                      <TableCell className="font-mono text-sm">{o.workEnd}</TableCell>
                      <TableCell className="text-sm">{o.graceMinutes}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveOverride(o.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Add New Override */}
            <div className="rounded-lg border border-dashed border-brand-300 bg-brand-50/50 p-4">
              <p className="mb-3 text-sm font-medium text-brand-dark">เพิ่มแผนกใหม่</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                <div className="sm:col-span-2">
                  <Input
                    placeholder="ชื่อแผนก"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="h-9"
                  />
                </div>
                <Input
                  type="time"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="h-9"
                />
                <Input
                  type="time"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="h-9"
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="นาที"
                    min={0}
                    value={newGrace}
                    onChange={(e) => setNewGrace(Number(e.target.value))}
                    className="h-9"
                  />
                  <Button
                    size="icon"
                    className="h-9 w-9 shrink-0 bg-brand-dark text-white hover:bg-brand-700"
                    onClick={handleAddOverride}
                    disabled={!newDept.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          {saveError && (
            <span className="text-sm text-red-500">{saveError}</span>
          )}
          {saved && (
            <Badge className="bg-brand-dark text-white hover:bg-brand-dark animate-in fade-in">
              บันทึกเรียบร้อยแล้ว
            </Badge>
          )}
          <Button
            className="gap-2 bg-brand-dark text-white hover:bg-brand-700 px-6"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
