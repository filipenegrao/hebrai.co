import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fastapiUrl = process.env.FASTAPI_URL ?? "http://localhost:8000";
  const upstream = await fetch(`${fastapiUrl}/session/next-cards`, {
    headers: { "X-User-ID": session.user.id },
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
