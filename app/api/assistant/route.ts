import { NextResponse } from "next/server";
import { AuthzError, requireApiRoles } from "@/lib/auth/permissions";
import { getAssistantAnswer } from "@/lib/ai/assistant-service";

const assistantRoles = [
  "super_admin",
  "tenant_admin",
  "receptionist",
  "phlebotomist",
  "technician",
  "pathologist",
  "finance",
] as const;

export async function POST(request: Request) {
  try {
    await requireApiRoles([...assistantRoles]);
    const raw = await request.json();
    const message = typeof raw?.message === "string" ? raw.message : "";
    const history = raw?.history;
    const answer = await getAssistantAnswer(message, history);
    return NextResponse.json({ ok: true, data: { answer } });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unknown assistant error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
