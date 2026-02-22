"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useEffect, useState } from "react";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const [unreadCount, setUnreadCount] = useState(5);

  useEffect(() => {
    // Connect to SSE for real-time notifications
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/notifications/subscribe");
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "new_notification") {
          setUnreadCount((prev) => prev + 1);
        }
      };
      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch {
      // SSE not available, use polling fallback
    }
    return () => {
      eventSource?.close();
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white px-6">
      <div>
        <h1 className="text-xl font-bold text-foreground font-title">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Search className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <Badge className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center bg-accent-brand-500 p-0 text-[9px] text-white hover:bg-accent-brand-500">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </Link>
      </div>
    </header>
  );
}
