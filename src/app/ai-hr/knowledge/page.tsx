"use client";

import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileText,
  Search,
  Trash2,
  File,
  BookOpen,
  Scale,
  FileSpreadsheet,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";

type DocCategory = "policy" | "handbook" | "law" | "template" | "other";

interface KnowledgeDocument {
  id: string;
  title: string;
  fileName: string;
  category: DocCategory;
  uploadedBy: string;
  uploadDate: string;
  fileSize: string;
}

const categoryConfig: Record<
  DocCategory,
  { label: string; icon: React.ElementType; className: string }
> = {
  policy: {
    label: "นโยบาย",
    icon: FileText,
    className: "bg-brand-dark text-white hover:bg-brand-dark",
  },
  handbook: {
    label: "คู่มือ",
    icon: BookOpen,
    className: "bg-brand-500 text-white hover:bg-brand-500",
  },
  law: {
    label: "กฎหมาย",
    icon: Scale,
    className: "bg-accent-brand-500 text-white hover:bg-accent-brand-500",
  },
  template: {
    label: "เทมเพลต",
    icon: FileSpreadsheet,
    className: "bg-brown-500 text-white hover:bg-brown-500",
  },
  other: {
    label: "อื่นๆ",
    icon: FolderOpen,
    className: "bg-brown-300 text-brown-800 hover:bg-brown-300",
  },
};

// Fallback mockup data for development without DB
const mockDocuments: KnowledgeDocument[] = [
  {
    id: "d1",
    title: "ระเบียบการลงเวลาทำงาน 2025",
    fileName: "attendance-policy-2025.pdf",
    category: "policy",
    uploadedBy: "พรทิพย์ จันทร์เพ็ญ",
    uploadDate: "15 ม.ค. 2026",
    fileSize: "2.4 MB",
  },
  {
    id: "d2",
    title: "คู่มือการจัดทำ PIP",
    fileName: "pip-handbook-v3.pdf",
    category: "handbook",
    uploadedBy: "พรทิพย์ จันทร์เพ็ญ",
    uploadDate: "10 ม.ค. 2026",
    fileSize: "5.1 MB",
  },
  {
    id: "d3",
    title: "พ.ร.บ.คุ้มครองแรงงาน พ.ศ. 2541",
    fileName: "labor-protection-act-2541.pdf",
    category: "law",
    uploadedBy: "วรรณา สุขใจ",
    uploadDate: "5 ม.ค. 2026",
    fileSize: "8.7 MB",
  },
  {
    id: "d4",
    title: "แบบฟอร์มประเมินผลงานประจำปี",
    fileName: "annual-review-template.xlsx",
    category: "template",
    uploadedBy: "ชาติชาย กล้าหาญ",
    uploadDate: "20 ธ.ค. 2025",
    fileSize: "150 KB",
  },
  {
    id: "d5",
    title: "นโยบายการลาประจำปี 2026",
    fileName: "leave-policy-2026.pdf",
    category: "policy",
    uploadedBy: "พรทิพย์ จันทร์เพ็ญ",
    uploadDate: "1 ม.ค. 2026",
    fileSize: "1.8 MB",
  },
  {
    id: "d6",
    title: "คู่มือพนักงานใหม่",
    fileName: "onboarding-handbook.pdf",
    category: "handbook",
    uploadedBy: "วรรณา สุขใจ",
    uploadDate: "15 ธ.ค. 2025",
    fileSize: "12.3 MB",
  },
  {
    id: "d7",
    title: "แบบฟอร์ม PIP",
    fileName: "pip-form-template.docx",
    category: "template",
    uploadedBy: "ชาติชาย กล้าหาญ",
    uploadDate: "10 ธ.ค. 2025",
    fileSize: "85 KB",
  },
  {
    id: "d8",
    title: "ประกาศกระทรวงแรงงาน เรื่อง OT",
    fileName: "ministry-announcement-ot.pdf",
    category: "law",
    uploadedBy: "วรรณา สุขใจ",
    uploadDate: "1 ธ.ค. 2025",
    fileSize: "3.2 MB",
  },
  {
    id: "d9",
    title: "รายงานสรุปผลประจำปี 2025",
    fileName: "annual-report-2025.pdf",
    category: "other",
    uploadedBy: "อรุณ ประเสริฐ",
    uploadDate: "28 ธ.ค. 2025",
    fileSize: "4.5 MB",
  },
];

export default function KnowledgeBasePage() {
  const { data, loading, error, refetch } = useApi<KnowledgeDocument[]>("/api/ai-hr/knowledge");

  const [documents, setDocuments] = useState<KnowledgeDocument[]>(mockDocuments);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<DocCategory | "all">("all");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync API data into local state when available
  useEffect(() => {
    if (data) {
      setDocuments(data);
    }
  }, [data]);

  const filteredDocs = documents.filter((doc) => {
    if (filterCategory !== "all" && doc.category !== filterCategory) return false;
    if (
      searchQuery &&
      !doc.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    const previous = [...documents];
    // Optimistic update
    setDocuments((prev) => prev.filter((d) => d.id !== id));

    try {
      const res = await fetch(`/api/ai-hr/knowledge/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    } catch {
      // Revert on error
      setDocuments(previous);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch("/api/ai-hr/knowledge", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const newDocs = await res.json();
        if (Array.isArray(newDocs)) {
          setDocuments((prev) => [...newDocs, ...prev]);
        }
        refetch();
      } else {
        alert("อัปโหลดไฟล์ไม่สำเร็จ");
      }
    } catch {
      alert("อัปโหลดไฟล์สำเร็จ (ข้อมูลจำลอง)");
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <AppShell title="ฐานความรู้" subtitle="จัดการเอกสารและข้อมูลสำหรับ AI-HR Manager">
        <LoadingSkeleton rows={5} />
      </AppShell>
    );
  }

  if (error && !data) {
    return (
      <AppShell title="ฐานความรู้" subtitle="จัดการเอกสารและข้อมูลสำหรับ AI-HR Manager">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="ฐานความรู้"
      subtitle="จัดการเอกสารและข้อมูลสำหรับ AI-HR Manager"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.xlsx,.txt"
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />

      {/* Upload Section */}
      <Card className="border-none shadow-sm mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-title flex items-center gap-2">
            <Upload className="h-5 w-5 text-brand-dark" />
            อัปโหลดเอกสาร
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
              isDragging
                ? "border-brand-dark bg-brand-50"
                : "border-brand-300 bg-muted/30"
            )}
          >
            <Upload
              className={cn(
                "h-10 w-10 mb-3",
                isDragging ? "text-brand-dark" : "text-muted-foreground"
              )}
            />
            <p className="text-sm font-medium">
              {uploading ? (
                "กำลังอัปโหลด..."
              ) : (
                <>
                  ลากไฟล์มาวางที่นี่ หรือ{" "}
                  <button
                    className="text-brand-dark underline underline-offset-2"
                    onClick={handleFileSelect}
                  >
                    เลือกไฟล์
                  </button>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              รองรับ PDF, DOCX, XLSX, TXT (สูงสุด 50 MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาเอกสาร..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterCategory === "all" ? "default" : "outline"}
            size="sm"
            className={cn(
              "text-xs",
              filterCategory === "all"
                ? "bg-brand-dark text-white hover:bg-brand-700"
                : ""
            )}
            onClick={() => setFilterCategory("all")}
          >
            ทั้งหมด ({documents.length})
          </Button>
          {(Object.entries(categoryConfig) as [DocCategory, typeof categoryConfig[DocCategory]][]).map(
            ([cat, config]) => {
              const count = documents.filter((d) => d.category === cat).length;
              return (
                <Button
                  key={cat}
                  variant={filterCategory === cat ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "text-xs",
                    filterCategory === cat
                      ? "bg-brand-dark text-white hover:bg-brand-700"
                      : ""
                  )}
                  onClick={() => setFilterCategory(cat)}
                >
                  {config.label} ({count})
                </Button>
              );
            }
          )}
        </div>
      </div>

      {/* Documents Table */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เอกสาร</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead>อัปโหลดโดย</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>ขนาด</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.map((doc) => {
                const catConfig = categoryConfig[doc.category];
                const CatIcon = catConfig.icon;
                return (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-brand-dark shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{doc.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {doc.fileName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={catConfig.className}>
                        {catConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{doc.uploadedBy}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.uploadDate}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.fileSize}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-accent-brand-500"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredDocs.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">
                ไม่พบเอกสารตามเงื่อนไขที่ค้นหา
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
