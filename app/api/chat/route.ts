import { NextRequest, NextResponse } from "next/server";
import { initMCP, processQuery, ServerConfig } from "@/lib/mcp-client";
import fs from "fs";
import path from "path";

function loadServerConfigs(): ServerConfig[] {
  const configPath = path.join(process.cwd(), "mcp-servers.json");
  const configFile = fs.readFileSync(configPath, "utf8");
  const config = JSON.parse(configFile);
  return config.servers;
}

export async function POST(req: NextRequest) {
  const { messages, enabledTools = [] } = await req.json();
  const userQuery = messages[messages.length - 1]?.content;

  if (!userQuery) {
    return NextResponse.json({ error: "No query provided" }, { status: 400 });
  }

  try {
    const serverConfigs = loadServerConfigs();
    await initMCP(serverConfigs);

    const { reply, toolCalls, toolResponses } = await processQuery(
      messages,
      enabledTools
    );

    if (toolCalls.length > 0) {
      const toolInfo = toolCalls
        .map((call) => `${call.function.name}`)
        .join(", ");

      const combinedContent = `**Tools used:** ${toolInfo}\n\n---\n\n${reply}`;

      return NextResponse.json({
        role: "assistant",
        content: combinedContent,
        toolResponses,
      });
    } else {
      return NextResponse.json({
        role: "assistant",
        content: reply,
        toolResponses: [],
      });
    }
  } catch (err) {
    console.error("[MCP Error]", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
