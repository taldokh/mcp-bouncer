import { McpServer, fromJsonSchema, type JsonSchemaType } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { client } from './client.js';

const upStreamName = client.getServerVersion()?.name ?? 'upstream';
const { tools } = await client.listTools();

function createServer(): McpServer {
    const server = new McpServer({ name: `${upStreamName}-bouncer`, version: '1.0.0' });

    for (const tool of tools) {
        server.registerTool(
            tool.name,
            {
                description: tool.description,
                inputSchema: fromJsonSchema(tool.inputSchema as JsonSchemaType)
            },
            async ( input ) => {
                const result = await client.callTool({ name: tool.name, arguments: input as Record<string, unknown> });
                return result;
            }
        );
    }

    return server;
}


void serveStdio(createServer);
console.error('ShopCo MCP server running on stdio');