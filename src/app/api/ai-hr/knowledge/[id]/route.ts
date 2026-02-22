import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { aiKnowledgeDocuments, aiEmbeddings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["admin", "super_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Delete embeddings first (foreign key constraint)
    await db.delete(aiEmbeddings).where(eq(aiEmbeddings.documentId, id));

    const [deleted] = await db
      .delete(aiKnowledgeDocuments)
      .where(eq(aiKnowledgeDocuments.id, id))
      .returning();

    if (!deleted) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/ai-hr/knowledge/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
