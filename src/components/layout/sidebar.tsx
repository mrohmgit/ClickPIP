"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Target,
  UserCircle,
  Clock,
  CalendarDays,
  ClipboardList,
  Award,
  Building2,
  Bot,
  Bell,
  BriefcaseBusiness,
  Brain,
  ShieldAlert,
  BookOpen,
  Lightbulb,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { currentUser } from "@/lib/mockup-data";
import { useState } from "react";

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const menuSections: MenuSection[] = [
  {
    title: "หลัก",
    items: [
      { label: "แดชบอร์ด", href: "/dashboard", icon: LayoutDashboard },
      { label: "การแจ้งเตือน", href: "/notifications", icon: Bell, badge: 5 },
    ],
  },
  {
    title: "PIP",
    items: [
      { label: "รายการ PIP", href: "/pip", icon: FileText, badge: 2 },
      { label: "PIP ของฉัน", href: "/my-pip", icon: UserCircle },
    ],
  },
  {
    title: "เวลาทำงาน",
    items: [
      { label: "ภาพรวมการเข้างาน", href: "/attendance", icon: Clock },
      { label: "บันทึกรายวัน", href: "/attendance/daily", icon: CalendarDays },
      { label: "การเข้างานของฉัน", href: "/attendance/my", icon: UserCircle },
      { label: "ขอทำล่วงเวลา", href: "/attendance/overtime", icon: BriefcaseBusiness },
      { label: "ขอลางาน", href: "/attendance/leave", icon: CalendarDays },
    ],
  },
  {
    title: "งานที่มอบหมาย",
    items: [
      { label: "บอร์ดงาน", href: "/tasks", icon: ClipboardList },
      { label: "งานของฉัน", href: "/tasks/my", icon: UserCircle },
    ],
  },
  {
    title: "การประเมิน",
    items: [
      { label: "รอบการประเมิน", href: "/assessments", icon: Award },
      { label: "ประเมินตนเอง", href: "/assessments/my", icon: UserCircle },
      { label: "แผนค่าตอบแทน", href: "/assessments/compensation", icon: DollarSign },
    ],
  },
  {
    title: "แผนก & KPI",
    items: [
      { label: "รายชื่อแผนก", href: "/departments", icon: Building2 },
    ],
  },
  {
    title: "AI-HR Manager",
    items: [
      { label: "แชท AI", href: "/ai-hr", icon: Bot },
      { label: "ข้อมูลเชิงลึก", href: "/ai-hr/insights", icon: Lightbulb },
      { label: "การแจ้งเตือน AI", href: "/ai-hr/alerts", icon: ShieldAlert },
      { label: "กฎการเฝ้าระวัง", href: "/ai-hr/guardrails", icon: Brain },
      { label: "ฐานความรู้", href: "/ai-hr/knowledge", icon: BookOpen },
    ],
  },
  {
    title: "ระบบ",
    items: [
      { label: "รายชื่อพนักงาน", href: "/employees", icon: Users },
      { label: "รายงาน", href: "/reports", icon: BarChart3 },
      { label: "ตั้งค่า", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  const roleLabel: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin (HR)",
    manager: "Manager",
    employee: "Employee",
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-brand-dark transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-white font-title">
                ClickPIP
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-brand-300">
                Performance
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500">
            <Target className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      <Separator className="bg-white/15" />

      {/* User Info */}
      <div className={cn("px-4 py-4", collapsed && "px-2 py-3")}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-brand-400">
              <AvatarFallback className="bg-brand-700 text-sm text-white font-body">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {currentUser.name}
              </p>
              <Badge
                variant="secondary"
                className="mt-0.5 bg-brand-500/20 text-[10px] text-brand-300 hover:bg-brand-500/30"
              >
                {roleLabel[currentUser.role]}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Avatar className="h-9 w-9 border-2 border-brand-400">
              <AvatarFallback className="bg-brand-700 text-xs text-white font-body">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      <Separator className="bg-white/15" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {menuSections.map((section) => (
          <div key={section.title} className="mb-2">
            {!collapsed && (
              <p className="mb-1 px-3 pt-2 text-[10px] font-medium uppercase tracking-wider text-white/40">
                {section.title}
              </p>
            )}
            {collapsed && <Separator className="my-1 bg-white/10" />}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    item.href !== "/notifications" &&
                    pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-white/15 text-white font-medium"
                        : "text-white/70 hover:bg-white/10 hover:text-white",
                      collapsed && "justify-center px-2"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="h-4.5 w-4.5 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-[13px]">{item.label}</span>
                        {item.badge && (
                          <Badge className="h-5 min-w-5 justify-center bg-accent-brand-500 text-[10px] text-white hover:bg-accent-brand-600">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/15 p-3">
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>ออกจากระบบ</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-white text-brand-dark shadow-sm hover:bg-brand-50"
      >
        <ChevronLeft
          className={cn(
            "h-3 w-3 transition-transform",
            collapsed && "rotate-180"
          )}
        />
      </Button>
    </aside>
  );
}
