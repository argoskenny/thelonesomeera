import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseArticlePayload } from "@/lib/articlePayload";
import { isAdminHostRequest } from "@/lib/adminHost";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  const article = await prisma.article.findFirst({
    where: { id, published: true },
  });
  if (!article) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }
  return NextResponse.json(article);
}

export async function PUT(request: NextRequest, { params }: Context) {
  if (!isAdminHostRequest(request)) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const data = parseArticlePayload(await request.json());
    const article = await prisma.article.update({
      where: { id },
      data,
    });
    return NextResponse.json(article);
  } catch (err) {
    const message = err instanceof Error ? err.message : "更新失敗";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  if (!isAdminHostRequest(request)) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    await prisma.article.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "刪除失敗" }, { status: 400 });
  }
}
