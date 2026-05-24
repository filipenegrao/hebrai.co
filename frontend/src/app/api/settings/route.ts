import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fastapiUrl = process.env.FASTAPI_URL ?? "http://localhost:8000";

  let upstream: Response;
  try {
    upstream = await fetch(`${fastapiUrl}/settings`, {
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

export async function PUT(request: NextRequest) {
  const session = await getSession();
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
    upstream = await fetch(`${fastapiUrl}/settings`, {
      method: "PUT",
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
