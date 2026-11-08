import { McpServer, fromJsonSchema, type JsonSchemaType, acceptedContent, inputRequired, inputResponse } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { connectUpstream } from './client.js';
import { PolicyRuleSchema, PolicySchema } from './policy.js';
import { scan } from './scan.js';
import config from '../config.json' with { type: 'json' };
import * as z from 'zod/v4';

const policy = PolicySchema.parse(config.policy);

const client = await connectUpstream({ command: config.upstream.command, args: config.upstream.args });
const upStreamName = client.getServerVersion()?.name ?? 'upstream';
const { tools } = await client.listTools();
const toolNames = tools.map(tool => tool.name);

const confirmationSchema = z.object({
    confirm: z.boolean().meta({ title: 'Confirm action' })
});

function createServer(): McpServer {
    const server = new McpServer({ name: `${upStreamName}-bouncer`, version: '1.0.0' });

    for (const tool of tools) {
        console.error(scan(tool, toolNames));
        const rule = policy[tool.name];
        if (rule !== PolicyRuleSchema.enum.allow && rule !== PolicyRuleSchema.enum.confirm) continue;
        server.registerTool(
            tool.name,
            {
                title: tool.title,
                description: tool.description,
                annotations: tool.annotations,
                inputSchema: fromJsonSchema(tool.inputSchema as JsonSchemaType),
                ...(tool.outputSchema && { outputSchema: fromJsonSchema(tool.outputSchema as JsonSchemaType) }),
            },
            async (input, ctx) => {
                if (rule === PolicyRuleSchema.enum.confirm) {
                    if (inputResponse(ctx.mcpReq.inputResponses, 'confirm').kind === 'missing') {
                        return inputRequired({
                            inputRequests: {
                                confirm: inputRequired.elicit({
                                    message: `Allow "${tool.name}" with arguments ${JSON.stringify(input)}?`,
                                    requestedSchema: confirmationSchema
                                })
                            }
                        })
                    }
                    const answer = acceptedContent(ctx.mcpReq.inputResponses, 'confirm', confirmationSchema);
                    if (answer?.confirm !== true) {
                        return { content: [{ type: 'text', text: `User did not approve ${tool.name} with arguments ${JSON.stringify(input)}` }], isError: true };
                    }
                }
                return client.callTool({ name: tool.name, arguments: input as Record<string, unknown> });
            });
    }

    return server;
}

void serveStdio(createServer);