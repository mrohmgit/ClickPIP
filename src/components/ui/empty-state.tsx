import { Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
}

export function EmptyState({
  title = "ไม่พบข้อมูล",
  description = "ยังไม่มีข้อมูลในขณะนี้",
  icon: Icon = Inbox,
  action,
}: EmptyStateProps) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-brown-50 p-3">
          <Icon className="h-8 w-8 text-brown-400" />
        </div>
        <p className="mt-4 font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}
