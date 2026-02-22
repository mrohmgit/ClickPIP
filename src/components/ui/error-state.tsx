import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "เกิดข้อผิดพลาดในการโหลดข้อมูล",
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-accent-brand-50 p-3">
          <AlertTriangle className="h-8 w-8 text-accent-brand-500" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            ลองใหม่
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
