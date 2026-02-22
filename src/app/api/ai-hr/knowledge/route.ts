import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { aiKnowledgeDocuments, aiEmbeddings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const documents = await db.query.aiKnowledgeDocuments.findMany({
      with: { uploader: true },
      orderBy: (docs, { desc }) => [desc(docs.createdAt)],
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("GET /api/ai-hr/knowledge error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["admin", "super_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const organizationId = formData.get("organizationId") as string;

    if (!file || !title) {
      return NextResponse.json({ error: "File and title are required" }, { status: 400 });
    }

    const content = await file.text();

    // Create document record
    const [document] = await db
      .insert(aiKnowledgeDocuments)
      .values({
        title,
        fileName: file.name,
        fileType: file.type,
        content,
        category,
        organizationId,
        uploadedBy: session.user.id,
      })
      .returning();

    // Chunk the content (simple splitting by paragraphs)
    const chunks = content
      .split(/\n\n+/)
      .filter((chunk) => chunk.trim().length > 50);

    // Insert chunks as embeddings (embedding generation would be done separately)
    for (let i = 0; i < chunks.length; i++) {
      await db.insert(aiEmbeddings).values({
        documentId: document.id,
        chunkText: chunks[i].trim(),
        chunkIndex: i,
        metadata: { title, category },
      });
    }

    return NextResponse.json(
      { ...document, chunksCreated: chunks.length },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/ai-hr/knowledge error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
