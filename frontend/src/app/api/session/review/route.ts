import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const fastapiUrl = process.env.FASTAPI_URL ?? "http://localhost:8000";

  const upstream = await fetch(`${fastapiUrl}/session/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-ID": session.user.id,
    },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
