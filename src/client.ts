import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

export interface UpstreamConfig {
    command: string;
    args?: string[];
}

export async function connectUpstream(cfg: UpstreamConfig): Promise<Client> { 
    const client = new Client({ name: 'mcp-bouncer-client', version: '1.0.0' });
    const transport = new StdioClientTransport({
        command: cfg.command,
        args: cfg.args
    });

    await client.connect(transport);

    return client;
 }
