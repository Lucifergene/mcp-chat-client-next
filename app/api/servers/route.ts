import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const configPath = path.join(process.cwd(), "mcp-servers.json");
    const configFile = fs.readFileSync(configPath, "utf8");

    const config = JSON.parse(configFile);

    const servers = config.servers.map((server: any) => ({
      name: server.name,
      displayName: server.name
        .split("-")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    }));

    return NextResponse.json({ servers });
  } catch (error) {
    console.error("Error loading server config:", error);
    return NextResponse.json(
      { error: "Failed to load server config" },
      { status: 500 }
    );
  }
}
