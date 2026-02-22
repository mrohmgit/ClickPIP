"use client";

import { useState, useRef, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Send,
  User,
  Plus,
  MessageSquare,
  Sparkles,
  FileText,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: { title: string; source: string }[];
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  date: string;
}

// Fallback mockup data for development without DB
const mockSessions: ChatSession[] = [
  {
    id: "s1",
    title: "แนวทาง PIP สำหรับพนักงานใหม่",
    lastMessage: "ควรพิจารณาระยะเวลาทดลองงาน...",
    date: "วันนี้",
  },
  {
    id: "s2",
    title: "นโยบายการลาประจำปี 2026",
    lastMessage: "ตามระเบียบบริษัท พนักงานมีสิทธิ์...",
    date: "เมื่อวาน",
  },
  {
    id: "s3",
    title: "การประเมินผลงานไตรมาส 1",
    lastMessage: "สำหรับการประเมินผลไตรมาสที่ 1...",
    date: "20 ก.พ.",
  },
  {
    id: "s4",
    title: "กฎหมายแรงงานเรื่องการเลิกจ้าง",
    lastMessage: "ตาม พ.ร.บ.คุ้มครองแรงงาน...",
    date: "18 ก.พ.",
  },
];

const initialMessages: ChatMessage[] = [
  {
    id: "m1",
    role: "assistant",
    content:
      "สวัสดีค่ะ ฉันคือ AI-HR Manager ผู้ช่วยด้านทรัพยากรบุคคลอัจฉริยะ สามารถช่วยคุณได้เกี่ยวกับ:\n\n- นโยบายและระเบียบบริษัท\n- แนวทางการจัดทำ PIP\n- กฎหมายแรงงาน\n- การประเมินผลงาน\n- การวิเคราะห์แนวโน้มพนักงาน\n\nมีอะไรให้ช่วยไหมคะ?",
    timestamp: "10:00",
  },
  {
    id: "m2",
    role: "user",
    content: "พนักงานมาสายบ่อยมาก ควรจัดการอย่างไร?",
    timestamp: "10:02",
  },
  {
    id: "m3",
    role: "assistant",
    content:
      "สำหรับพนักงานที่มาสายบ่อยครั้ง แนะนำให้ดำเนินการตามลำดับดังนี้:\n\n1. **ตรวจสอบข้อมูล** - ดูสถิติการมาสายจากระบบลงเวลา เพื่อยืนยันความถี่และรูปแบบ\n\n2. **พูดคุยอย่างไม่เป็นทางการ** - สอบถามสาเหตุ อาจมีปัญหาส่วนตัวหรือปัญหาการเดินทาง\n\n3. **แจ้งเตือนเป็นลายลักษณ์อักษร** - หากยังไม่ดีขึ้น ออกหนังสือเตือนครั้งที่ 1 ตามระเบียบ\n\n4. **พิจารณา PIP** - หากมาสายเกิน 5 ครั้ง/เดือน ติดต่อกัน 2 เดือน ให้พิจารณาเข้า PIP\n\n5. **ดำเนินการทางวินัย** - ตาม พ.ร.บ.คุ้มครองแรงงาน มาตรา 119 การเลิกจ้างต้องเตือนเป็นหนังสืออย่างน้อย 2 ครั้ง",
    citations: [
      { title: "ระเบียบการลงเวลาทำงาน 2025", source: "นโยบายบริษัท" },
      { title: "พ.ร.บ.คุ้มครองแรงงาน มาตรา 119", source: "กฎหมาย" },
    ],
    timestamp: "10:02",
  },
];

const suggestedQuestions = [
  "วิธีจัดทำ PIP ที่มีประสิทธิภาพ",
  "ตัวชี้วัดสำคัญที่ควรใช้ประเมินพนักงาน",
  "สิทธิ์การลาตามกฎหมายแรงงาน",
  "แนวทางรับมือเมื่อพนักงานปฏิเสธ PIP",
];

export default function AIHRPage() {
  const { data: sessionsData, loading: sessionsLoading, error: sessionsError, refetch: refetchSessions } = useApi<ChatSession[]>("/api/ai-hr/chat");

  const sessions = sessionsData ?? mockSessions;

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [activeSession, setActiveSession] = useState("s1");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = inputValue;
    setInputValue("");

    // Create a placeholder for the assistant message
    const assistantMsgId = `m-${Date.now() + 1}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsStreaming(true);

    try {
      abortControllerRef.current = new AbortController();
      const res = await fetch("/api/ai-hr/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession,
          message: currentInput,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let accumulatedContent = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: accumulatedContent }
                : m
            )
          );
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled - do nothing
      } else {
        // Fallback: show mock response when API is not available
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    "ขอบคุณสำหรับคำถามค่ะ ฉันกำลังวิเคราะห์ข้อมูลจากฐานความรู้ของบริษัทและกฎหมายแรงงานที่เกี่ยวข้อง กรุณารอสักครู่นะคะ...\n\n(นี่คือตัวอย่างข้อมูลจำลอง - ในระบบจริงจะเชื่อมต่อกับ AI Model)",
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [inputValue, isStreaming, activeSession]);

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  const handleNewSession = () => {
    setMessages([initialMessages[0]]);
    setActiveSession(`s-${Date.now()}`);
  };

  return (
    <AppShell title="AI-HR Manager" subtitle="ผู้ช่วยด้าน HR อัจฉริยะ">
      <div className="flex gap-4 h-[calc(100vh-160px)]">
        {/* Sidebar - Previous Sessions */}
        <div className="w-72 shrink-0 flex flex-col">
          <Button
            className="mb-3 w-full bg-brand-dark hover:bg-brand-700 text-white"
            onClick={handleNewSession}
          >
            <Plus className="mr-1 h-4 w-4" />
            สนทนาใหม่
          </Button>
          <div className="flex-1 space-y-1 overflow-y-auto">
            {sessionsLoading ? (
              <div className="space-y-2 px-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse space-y-1 rounded-lg p-2">
                    <div className="h-3 w-3/4 rounded bg-brown-100" />
                    <div className="h-2 w-1/2 rounded bg-brown-50" />
                  </div>
                ))}
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setActiveSession(session.id)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                    activeSession === session.id
                      ? "bg-brand-100 text-brand-dark"
                      : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">
                      {session.title}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate pl-6">
                    {session.lastMessage}
                  </p>
                  <p className="text-[10px] text-muted-foreground pl-6">
                    {session.date}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <Card className="flex-1 border-none shadow-sm flex flex-col">
          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="shrink-0 h-8 w-8 rounded-full bg-brand-dark flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-3",
                    msg.role === "user"
                      ? "bg-brand-dark text-white"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-line">{msg.content}</p>

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-border/30 pt-2">
                      <p className="text-[10px] font-medium text-muted-foreground">
                        แหล่งอ้างอิง:
                      </p>
                      {msg.citations.map((cite, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 text-[11px]"
                        >
                          <FileText className="h-3 w-3 text-brand-dark" />
                          <span className="font-medium">{cite.title}</span>
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 px-1"
                          >
                            {cite.source}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      msg.role === "user"
                        ? "text-white/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {msg.timestamp}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="shrink-0 h-8 w-8 rounded-full bg-brown-500 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}
          </CardContent>

          {/* Suggested Questions */}
          <div className="px-4 pb-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-brand-dark" />
              <span className="text-xs text-muted-foreground">คำถามแนะนำ:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 text-brand-dark border-brand-300 hover:bg-brand-50"
                  onClick={() => handleSuggestedQuestion(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="พิมพ์คำถามเกี่ยวกับ HR..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1"
              />
              <Button
                className="bg-brand-dark hover:bg-brand-700 text-white"
                onClick={handleSend}
                disabled={!inputValue.trim() || isStreaming}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
