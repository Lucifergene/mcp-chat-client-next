import { NextResponse } from "next/server";
import { getProviderStatus } from "@/lib/mcp-client";

export async function GET() {
  try {
    const status = getProviderStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get provider status",
        connected: false,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
