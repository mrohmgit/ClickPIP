import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { aiChatSessions, aiChatMessages } from "@/db/schema";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { messages, sessionId } = await req.json();

    // Create or reuse chat session
    let chatSessionId = sessionId;
    if (!chatSessionId) {
      const [newSession] = await db
        .insert(aiChatSessions)
        .values({
          userId: session.user.id,
          title: messages[0]?.content?.slice(0, 100) || "New chat",
        })
        .returning();
      chatSessionId = newSession.id;
    }

    // Save user message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "user") {
      await db.insert(aiChatMessages).values({
        sessionId: chatSessionId,
        role: "user",
        content: lastMessage.content,
      });
    }

    const result = streamText({
      model: openai("gpt-4o"),
      system: `You are an AI HR assistant for the ClickPIP platform. You help HR managers and employees with questions about performance improvement plans, attendance, assessments, tasks, and general HR inquiries. Be professional, accurate, and helpful. If you're unsure about specific company data, say so clearly.`,
      messages,
      async onFinish({ text }) {
        // Save assistant response
        await db.insert(aiChatMessages).values({
          sessionId: chatSessionId,
          role: "assistant",
          content: text,
        });
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("POST /api/ai-hr/chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
