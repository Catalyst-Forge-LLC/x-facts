import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { FetchContext, McpToolsListResult, TransportKind } from "./types.ts";

export interface FetchedSource {
  source: McpToolsListResult;
  ctx: FetchContext;
}

export async function fetchStdio(command: string, args: string[]): Promise<FetchedSource> {
  const transport = new StdioClientTransport({ command, args, stderr: "pipe" });
  const client = new Client({ name: "xfacts-panel", version: "0.1.0" });
  await client.connect(transport);
  try {
    const listed = await client.listTools();
    const info = client.getServerVersion();
    const sourceUrl = `stdio://${[command, ...args].join(" ")}`;
    const ctx: FetchContext = {
      transport: "stdio",
      sourceUrl,
      canonicalUrl: sourceUrl,
      subjectName: info?.name,
      subjectVersion: info?.version,
    };
    return { source: listed as McpToolsListResult, ctx };
  } finally {
    await client.close();
  }
}

export async function fetchHttp(url: string, transportKind: TransportKind = "streamable-http"): Promise<FetchedSource> {
  const transport = new StreamableHTTPClientTransport(new URL(url));
  const client = new Client({ name: "xfacts-panel", version: "0.1.0" });
  await client.connect(transport);
  try {
    const listed = await client.listTools();
    const info = client.getServerVersion();
    const ctx: FetchContext = {
      transport: transportKind,
      sourceUrl: url,
      canonicalUrl: url,
      subjectName: info?.name,
      subjectVersion: info?.version,
    };
    return { source: listed as McpToolsListResult, ctx };
  } finally {
    await client.close();
  }
}
