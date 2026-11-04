import { McpServer, fromJsonSchema, type JsonSchemaType } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { connectUpstream } from './client.js';
import config from '../config.json' with { type: 'json' };


const client = await connectUpstream({ command: config.upstream.command, args: config.upstream.args });

const upStreamName = client.getServerVersion()?.name ?? 'upstream';
const { tools } = await client.listTools();

function createServer(): McpServer {
    const server = new McpServer({ name: `${upStreamName}-bouncer`, version: '1.0.0' });

    for (const tool of tools) {
        server.registerTool(
            tool.name,
            {
                title: tool.title,
                description: tool.description,
                annotations: tool.annotations,
                inputSchema: fromJsonSchema(tool.inputSchema as JsonSchemaType),
                ...(tool.outputSchema && { outputSchema: fromJsonSchema(tool.outputSchema as JsonSchemaType) }),
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