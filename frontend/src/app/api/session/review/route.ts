import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const fastapiUrl = process.env.FASTAPI_URL ?? "http://localhost:8000";

  let upstream: Response;
  try {
    upstream = await fetch(`${fastapiUrl}/session/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": session.user.id,
      },
      body: JSON.stringify(body),
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
