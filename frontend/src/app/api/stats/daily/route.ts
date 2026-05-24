import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fastapiUrl = process.env.FASTAPI_URL ?? "http://localhost:8000";

  let upstream: Response;
  try {
    upstream = await fetch(`${fastapiUrl}/stats/daily`, {
      cache: "no-store",
      headers: { "X-User-ID": session.user.id },
    });
  } catch {
    return NextResponse.json({ error: "Serviço indisponível" }, { status: 503 });
  }

  let data: unknown;
  try {
    data = await upstream.json();
  } catch {
    return NextResponse.json({ error: "Resposta inválida do servidor" }, { status: 502 });
  }

  return NextResponse.json(data, { status: upstream.status });
}
