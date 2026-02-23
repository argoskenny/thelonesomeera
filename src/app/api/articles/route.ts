import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(articles);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const article = await prisma.article.create({ data });
    return NextResponse.json(article, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "建立失敗";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
