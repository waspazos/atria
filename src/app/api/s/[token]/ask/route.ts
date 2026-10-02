import type { NextRequest } from "next/server";
import { answerQuestion } from "@/lib/chat/answer";
import { getClientSpaceByToken } from "@/lib/data/client-space";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/s/[token]/ask">) {
  const { token } = await ctx.params;
  const result = await getClientSpaceByToken(token);
  if (result.status !== "ok") {
    return Response.json({ error: result.status }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { question?: unknown } | null;
  const question = typeof body?.question === "string" ? body.question.trim().slice(0, 500) : "";
  if (!question) return Response.json({ error: "empty_question" }, { status: 400 });

  return Response.json(answerQuestion(result.view, question));
}
