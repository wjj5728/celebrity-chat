import { NextResponse } from "next/server";

export async function GET() {
  const hasRayincodeKey = Boolean(process.env.RAYINCODE_API_KEY);

  return NextResponse.json({
    ok: true,
    service: "celebrity-chat",
    modelProvider: hasRayincodeKey ? "rayincode" : "mock",
    hasRayincodeKey,
    timestamp: Date.now(),
  });
}
