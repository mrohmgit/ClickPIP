"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  FileText,
  Users,
  Target,
  Clock,
  MessageSquare,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useApi, useApiMutation } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";

type NotificationType =
  | "pip_update"
  | "alert"
  | "info"
  | "task"
  | "assessment"
  | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timeAgo: string;
  read: boolean;
  link: string;
}

const typeConfig: Record<
  NotificationType,
  { icon: React.ElementType; color: string }
> = {
  pip_update: { icon: Target, color: "bg-brand-dark" },
  alert: { icon: AlertTriangle, color: "bg-accent-brand-500" },
  info: { icon: Info, color: "bg-brand-500" },
  task: { icon: FileText, color: "bg-brown-500" },
  assessment: { icon: Users, color: "bg-brand-700" },
  system: { icon: Bell, color: "bg-brown-300" },
};

// Fallback mockup data for development without DB
const mockNotifications: Notification[] = [
  {
    id: "n1",
    type: "alert",
    title: "แจ้งเตือนวิกฤต: พนักงานมาสายเกินเกณฑ์",
    body: "พิชัย มงคลชัย มาสาย 8 ครั้งในเดือนนี้ ซึ่งเกินเกณฑ์กำหนดที่ 5 ครั้ง/เดือน",
    timeAgo: "5 นาทีที่แล้ว",
    read: false,
    link: "/ai-hr/alerts",
  },
  {
    id: "n2",
    type: "pip_update",
    title: "PIP อัปเดต: ธีรพล วัฒนา",
    body: "ความคืบหน้า PIP เพิ่มขึ้นเป็น 40% - ยังไม่บรรลุเป้าหมายที่ 2",
    timeAgo: "15 นาทีที่แล้ว",
    read: false,
    link: "/pip",
  },
  {
    id: "n3",
    type: "task",
    title: "งานที่ต้องทำ: ประเมินผล Check-in",
    body: "คุณมี Check-in 2 รายการที่ต้องประเมินผลภายในวันนี้",
    timeAgo: "30 นาทีที่แล้ว",
    read: false,
    link: "/pip",
  },
  {
    id: "n4",
    type: "assessment",
    title: "ครบกำหนดประเมินผลไตรมาส 1/2026",
    body: "กรุณาเริ่มกระบวนการประเมินผลงานประจำไตรมาสสำหรับพนักงานในแผนกของคุณ",
    timeAgo: "1 ชั่วโมงที่แล้ว",
    read: false,
    link: "/assessments",
  },
  {
    id: "n5",
    type: "pip_update",
    title: "PIP สำเร็จ: นภา แสงจันทร์",
    body: "นภา แสงจันทร์ บรรลุเป้าหมาย PIP ทุกข้อ คะแนนเฉลี่ย 88%",
    timeAgo: "2 ชั่วโมงที่แล้ว",
    read: true,
    link: "/pip",
  },
  {
    id: "n6",
    type: "info",
    title: "AI Insight ใหม่: ฝ่ายขายมีคะแนนลดลง",
    body: "พบว่าคะแนนผลงานเฉลี่ยของฝ่ายขายลดลง 15% เทียบกับไตรมาสก่อน",
    timeAgo: "3 ชั่วโมงที่แล้ว",
    read: true,
    link: "/ai-hr/insights",
  },
  {
    id: "n7",
    type: "alert",
    title: "ภาระงานสูง: ประสิทธิ์ เจริญสุข",
    body: "ทำงานล่วงเวลาเฉลี่ย 4 ชั่วโมง/วัน เป็นเวลา 2 สัปดาห์ติดต่อกัน",
    timeAgo: "4 ชั่วโมงที่แล้ว",
    read: true,
    link: "/ai-hr/alerts",
  },
  {
    id: "n8",
    type: "system",
    title: "ระบบอัปเดต: เพิ่มฟีเจอร์ AI Guardrails",
    body: "ตอนนี้คุณสามารถตั้งค่า Guardrails เพื่อให้ AI แจ้งเตือนอัตโนมัติเมื่อเกิดเหตุการณ์ผิดปกติ",
    timeAgo: "1 วันที่แล้ว",
    read: true,
    link: "/ai-hr/guardrails",
  },
  {
    id: "n9",
    type: "task",
    title: "เอกสารใหม่ในฐานความรู้",
    body: "อัปโหลดนโยบายการลาประจำปี 2026 เรียบร้อยแล้ว",
    timeAgo: "1 วันที่แล้ว",
    read: true,
    link: "/ai-hr/knowledge",
  },
  {
    id: "n10",
    type: "assessment",
    title: "รายงานผลประเมินพร้อมดู",
    body: "รายงานสรุปผลประเมิน 360 องศา ไตรมาส 4/2025 พร้อมให้ดูแล้ว",
    timeAgo: "2 วันที่แล้ว",
    read: true,
    link: "/reports",
  },
];

export default function NotificationsPage() {
  const { data, loading, error, refetch } = useApi<Notification[]>("/api/notifications");
  const { mutate, loading: mutating } = useApiMutation("/api/notifications");

  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  // Sync API data into local state when available
  useEffect(() => {
    if (data) {
      setNotifications(data);
    }
  }, [data]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await mutate({
      method: "PATCH",
      body: { id, action: "markRead" },
      onError: () => {
        // Revert on error
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: false } : n))
        );
      },
    });
  };

  const handleMarkAllAsRead = async () => {
    const previousNotifications = [...notifications];
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await mutate({
      method: "PATCH",
      body: { action: "markAllRead" },
      onError: () => {
        // Revert on error
        setNotifications(previousNotifications);
      },
    });
  };

  const renderNotificationList = (items: Notification[]) => (
    <div className="space-y-2">
      {items.map((notif) => {
        const config = typeConfig[notif.type];
        const Icon = config.icon;

        return (
          <Link key={notif.id} href={notif.link}>
            <Card
              className={cn(
                "border-none shadow-sm transition-colors hover:bg-muted/50 cursor-pointer",
                !notif.read && "bg-brand-50/40"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("shrink-0 rounded-lg p-2", config.color)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            className={cn(
                              "text-sm",
                              !notif.read ? "font-semibold" : "font-medium"
                            )}
                          >
                            {notif.title}
                          </h3>
                          {!notif.read && (
                            <span className="h-2 w-2 rounded-full bg-accent-brand-500 shrink-0" />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {notif.body}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {notif.timeAgo}
                        </span>
                        {!notif.read && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground hover:text-brand-dark"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleMarkAsRead(notif.id);
                            }}
                            disabled={mutating}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}

      {items.length === 0 && (
        <div className="text-center py-12">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">
            ไม่มีการแจ้งเตือน
          </p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <AppShell title="การแจ้งเตือน" subtitle="ศูนย์รวมการแจ้งเตือนทั้งหมด">
        <LoadingSkeleton rows={5} />
      </AppShell>
    );
  }

  if (error && !data) {
    return (
      <AppShell title="การแจ้งเตือน" subtitle="ศูนย์รวมการแจ้งเตือนทั้งหมด">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }

  return (
    <AppShell title="การแจ้งเตือน" subtitle="ศูนย์รวมการแจ้งเตือนทั้งหมด">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-brand-dark" />
          {unreadCount > 0 && (
            <Badge className="bg-accent-brand-500 text-white hover:bg-accent-brand-500">
              {unreadCount} ยังไม่อ่าน
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-brand-dark"
            onClick={handleMarkAllAsRead}
            disabled={mutating}
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            อ่านทั้งหมดแล้ว
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            ทั้งหมด ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            ยังไม่อ่าน ({unreadCount})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {renderNotificationList(notifications)}
        </TabsContent>
        <TabsContent value="unread" className="mt-4">
          {renderNotificationList(notifications.filter((n) => !n.read))}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
