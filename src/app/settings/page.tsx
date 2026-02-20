"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Settings,
  Users,
  Building2,
  FilePlus2,
  Bell,
  PlusCircle,
  Pencil,
  Trash2,
  Save,
  Target,
  Shield,
  Mail,
} from "lucide-react";
import { mockUsers, mockDepartments } from "@/lib/mockup-data";
import type { UserRole } from "@/lib/types";

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  super_admin: { label: "Super Admin", className: "bg-brand-700 text-white hover:bg-brand-700" },
  admin: { label: "Admin (HR)", className: "bg-brand-dark text-white hover:bg-brand-dark" },
  manager: { label: "Manager", className: "bg-brand-500 text-white hover:bg-brand-500" },
  employee: { label: "Employee", className: "bg-brown-200 text-brown-800 hover:bg-brown-200" },
};

const mockTemplates = [
  {
    id: "t1",
    name: "Sales Performance",
    description: "เทมเพลตสำหรับพนักงานขายที่ผลงานต่ำกว่าเป้า",
    duration: 60,
    goals: [
      { title: "เพิ่มยอดขายรายเดือน", kpiUnit: "บาท" },
      { title: "เพิ่มจำนวนลูกค้าใหม่", kpiUnit: "ราย" },
      { title: "พัฒนาทักษะการนำเสนอ", kpiUnit: "ชั่วโมง" },
    ],
  },
  {
    id: "t2",
    name: "Operations Efficiency",
    description: "เทมเพลตสำหรับพนักงานปฏิบัติการที่ทำงานล่าช้า",
    duration: 90,
    goals: [
      { title: "ลดเวลาประมวลผลเอกสาร", kpiUnit: "วัน" },
      { title: "ลดอัตราข้อผิดพลาด", kpiUnit: "%" },
    ],
  },
  {
    id: "t3",
    name: "Customer Service",
    description: "เทมเพลตสำหรับพนักงานบริการลูกค้า",
    duration: 30,
    goals: [
      { title: "เพิ่มคะแนน Customer Satisfaction", kpiUnit: "คะแนน" },
      { title: "ลดเวลาตอบกลับลูกค้า", kpiUnit: "นาที" },
      { title: "เพิ่มอัตราการแก้ปัญหาในครั้งแรก", kpiUnit: "%" },
    ],
  },
];

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell title="ตั้งค่า" subtitle="จัดการระบบ ClickPIP">
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-white">
          <TabsTrigger value="users" className="data-[state=active]:bg-brand-dark data-[state=active]:text-white">
            <Users className="mr-2 h-4 w-4" />
            ผู้ใช้งาน
          </TabsTrigger>
          <TabsTrigger value="departments" className="data-[state=active]:bg-brand-dark data-[state=active]:text-white">
            <Building2 className="mr-2 h-4 w-4" />
            แผนก
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-brand-dark data-[state=active]:text-white">
            <FilePlus2 className="mr-2 h-4 w-4" />
            เทมเพลต PIP
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-brand-dark data-[state=active]:text-white">
            <Bell className="mr-2 h-4 w-4" />
            การแจ้งเตือน
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-brand-dark data-[state=active]:text-white">
            <Settings className="mr-2 h-4 w-4" />
            ระบบ
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-title">จัดการผู้ใช้งาน</CardTitle>
              <Button size="sm" className="bg-brand-dark hover:bg-brand-700">
                <PlusCircle className="mr-2 h-4 w-4" />
                เพิ่มผู้ใช้
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ผู้ใช้งาน</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>แผนก</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="w-[100px]">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.map((user) => {
                    const initials = user.name.split(" ").map((n) => n[0]).join("");
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-brand-100 text-brand-dark font-body text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-[10px] text-muted-foreground">{user.position}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{user.email}</TableCell>
                        <TableCell className="text-sm">{user.department}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${roleConfig[user.role].className}`}>
                            {roleConfig[user.role].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-brand-100 text-brand-dark hover:bg-brand-100 text-[10px]">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-accent-brand-500">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-title">จัดการแผนก</CardTitle>
              <Button size="sm" className="bg-brand-dark hover:bg-brand-700">
                <PlusCircle className="mr-2 h-4 w-4" />
                เพิ่มแผนก
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อแผนก</TableHead>
                    <TableHead>หัวหน้าแผนก</TableHead>
                    <TableHead className="text-center">จำนวนพนักงาน</TableHead>
                    <TableHead className="text-center">PIP Active</TableHead>
                    <TableHead className="w-[100px]">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDepartments.map((dept) => {
                    const manager = mockUsers.find((u) => u.id === dept.managerId);
                    const deptUsers = mockUsers.filter((u) => u.department === dept.name);
                    const deptActivePIPs = deptUsers.reduce((count, u) => {
                      return count + (u.role === "employee" ? mockUsers.filter(
                        () => true
                      ).length : 0);
                    }, 0);
                    return (
                      <TableRow key={dept.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
                              <Building2 className="h-4 w-4 text-brand-dark" />
                            </div>
                            <span className="font-medium">{dept.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {manager?.name || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{deptUsers.length} คน</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-brand-100 text-brand-dark hover:bg-brand-100 text-[10px]">
                            {deptActivePIPs > 0 ? deptActivePIPs : 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-accent-brand-500">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                เทมเพลตสำเร็จรูปสำหรับสร้าง PIP อย่างรวดเร็ว
              </p>
              <Button size="sm" className="bg-brand-dark hover:bg-brand-700">
                <PlusCircle className="mr-2 h-4 w-4" />
                สร้างเทมเพลตใหม่
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {mockTemplates.map((template) => (
                <Card key={template.id} className="border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-title">
                        {template.name}
                      </CardTitle>
                      <Badge variant="outline">{template.duration} วัน</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                    <Separator />
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        เป้าหมาย ({template.goals.length})
                      </p>
                      <div className="space-y-1.5">
                        {template.goals.map((goal, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 rounded bg-muted/50 px-2 py-1.5"
                          >
                            <Target className="h-3 w-3 shrink-0 text-brand-dark" />
                            <span className="flex-1 text-sm">{goal.title}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {goal.kpiUnit}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Pencil className="mr-2 h-3 w-3" />
                        แก้ไข
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-brand-dark hover:bg-brand-700"
                      >
                        ใช้เทมเพลต
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-title">
                <Bell className="h-5 w-5 text-brand-dark" />
                ตั้งค่าการแจ้งเตือน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  title: "แจ้งเตือนเมื่อสร้าง PIP ใหม่",
                  description: "ส่ง email ถึงพนักงานเมื่อถูกเปิด PIP",
                  enabled: true,
                },
                {
                  title: "แจ้งเตือน Check-in",
                  description: "ส่ง email เตือน manager ทุกสัปดาห์ให้ทำ check-in",
                  enabled: true,
                },
                {
                  title: "แจ้งเตือนใกล้ครบกำหนด",
                  description: "ส่ง email เมื่อ PIP เหลือเวลาน้อยกว่า 14 วัน",
                  enabled: true,
                },
                {
                  title: "แจ้งเตือนผลประเมิน",
                  description: "ส่ง email แจ้งผลประเมินถึงพนักงานและ HR",
                  enabled: true,
                },
                {
                  title: "แจ้งเตือนความคิดเห็นใหม่",
                  description: "ส่ง email เมื่อมีความคิดเห็นใหม่ใน PIP",
                  enabled: false,
                },
                {
                  title: "สรุปรายสัปดาห์",
                  description: "ส่ง email สรุป PIP ทั้งหมดให้ HR ทุกวันจันทร์",
                  enabled: false,
                },
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded-lg p-2 ${item.enabled ? "bg-brand-100" : "bg-muted"}`}>
                        <Mail className={`h-4 w-4 ${item.enabled ? "text-brand-dark" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <Button
                      variant={item.enabled ? "default" : "outline"}
                      size="sm"
                      className={item.enabled ? "bg-brand-dark hover:bg-brand-700" : ""}
                    >
                      {item.enabled ? "เปิด" : "ปิด"}
                    </Button>
                  </div>
                  {index < 5 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-title">
                  <Settings className="h-5 w-5 text-brand-dark" />
                  ตั้งค่าทั่วไป
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>ชื่อองค์กร</Label>
                  <Input defaultValue="Click Insurance Broker Limited" />
                </div>
                <div className="space-y-2">
                  <Label>ระยะเวลา PIP เริ่มต้น</Label>
                  <Select defaultValue="60">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 วัน</SelectItem>
                      <SelectItem value="60">60 วัน</SelectItem>
                      <SelectItem value="90">90 วัน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>จำนวนเป้าหมายขั้นต่ำต่อ PIP</Label>
                  <Input type="number" defaultValue="2" />
                </div>
                <div className="space-y-2">
                  <Label>จำนวนเป้าหมายสูงสุดต่อ PIP</Label>
                  <Input type="number" defaultValue="5" />
                </div>
                <div className="space-y-2">
                  <Label>ข้อความแจ้งเตือนใกล้ครบกำหนด (วัน)</Label>
                  <Input type="number" defaultValue="14" />
                </div>
                <Button
                  className="bg-brand-dark hover:bg-brand-700"
                  onClick={handleSave}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saved ? "บันทึกแล้ว!" : "บันทึกการตั้งค่า"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-title">
                  <Shield className="h-5 w-5 text-brand-dark" />
                  ข้อมูลระบบ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "เวอร์ชัน", value: "1.0.0 MVP" },
                  { label: "Framework", value: "Next.js 16" },
                  { label: "Database", value: "Supabase (Mockup)" },
                  { label: "Auth", value: "Google OAuth (Mockup)" },
                  { label: "พนักงานทั้งหมด", value: `${mockUsers.length} คน` },
                  { label: "แผนกทั้งหมด", value: `${mockDepartments.length} แผนก` },
                  { label: "ภาษา", value: "ไทย" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
