import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { getOrderStatus, deleteOrder, cancelOrder, listCustomerOrders, getShippingOptions, getCustomer, getDocumentsList, readDocument, sendEmail } from './backend/service.js';
import * as z from 'zod/v4';


function createServer(): McpServer {
    const server = new McpServer({ name: 'ShopCo', version: '1.0.0' });

    server.registerTool(
        'get-order-status',
        {
            description: 'Get the status of a specific order',
            inputSchema: z.object({
                orderId: z.string().regex(/^\d+$/, 'Order IDs are numeric, e.g. 1001').describe('The ID of the order to check')
            })
        },
        async ({ orderId }) => {
            const { status } = getOrderStatus(orderId);
            return { content: [{ type: 'text', text: `Order ${orderId} is ${status}` }] };
        }
    );

    server.registerTool(
        'delete-order',
        {
            description: 'Delete a specific order',
            inputSchema: z.object({
                orderId: z.string().regex(/^\d+$/, 'Order IDs are numeric, e.g. 1001').describe('The ID of the order to delete.')
            })
        },
        async ({ orderId }) => {
            deleteOrder(orderId);
            return { content: [{ type: 'text', text: `Order ${orderId} has been deleted` }] };
        }
    );

    server.registerTool(
        'get-customer',
        {
            description: 'Get information about a specific customer',
            inputSchema: z.object({
                customerId: z.string().regex(/^c\d+$/, 'Customer IDs look like c1').describe('The ID of the customer to retrieve')
            })
        },
        async ({ customerId }) => {
            const customer = getCustomer(customerId);
            return { content: [{ type: 'text', text: `Customer ${customerId} information: ${JSON.stringify(customer)}` }] };
        }
    );

    server.registerTool(
        'get-documents-list',
        {
            description: 'Get a list of available documents',
            inputSchema: z.object({})
        },
        async ({ }) => {
            const documents = getDocumentsList();
            return { content: [{ type: 'text', text: `Available documents: ${JSON.stringify(documents)}` }] };
        }
    );

    server.registerTool(
        'read-document',
        {
            description: 'Read a specific document',
            inputSchema: z.object({
                documentId: z.string().regex(/^doc-\d+$/, 'Document IDs look like doc-1').describe('The ID of the document to read')
            })
        },
        async ({ documentId }) => {
            const document = readDocument(documentId);
            return { content: [{ type: 'text', text: `Document ${documentId} content: ${JSON.stringify(document)}` }] };
        }
    );

    server.registerTool(
        'send-email',
        {
            description: 'Send an email to a specific customer',
            inputSchema: z.object({
                to: z.email().describe('The email address of the recipient'),
                subject: z.string().min(1).describe('The subject of the email'),
                body: z.string().describe('The body of the email')
            })
        },
        async ({ to, subject, body }) => {
            sendEmail({ to, subject, body });
            return { content: [{ type: 'text', text: 'Email sent successfully' }] };
        }
    );

    server.registerTool(
        'list-customer-orders',
        {
            description: 'List all orders of a specific customer',
            inputSchema: z.object({
                customerId: z.string().regex(/^c\d+$/, 'Customer IDs look like c1').describe('The ID of the customer whose orders to list')
            })
        },
        async ({ customerId }) => {
            const customerOrders = listCustomerOrders(customerId);
            return { content: [{ type: 'text', text: `Orders of customer ${customerId}: ${JSON.stringify(customerOrders)}` }] };
        }
    );

    server.registerTool(
        'get-shipping-options',
        {
            description: 'Get the available shipping options with their delivery times and prices',
            inputSchema: z.object({})
        },
        async ({ }) => {
            const options = getShippingOptions();
            return { content: [{ type: 'text', text: `Shipping options: ${JSON.stringify(options)}` }] };
        }
    );

    server.registerTool(
        'cancel-order',
        {
            description: 'Cancel a specific order',
            inputSchema: z.object({
                orderId: z.string().regex(/^\d+$/, 'Order IDs are numeric, e.g. 1001').describe('The ID of the order to cancel')
            })
        },
        async ({ orderId }) => {
            const { status } = cancelOrder(orderId);
            return { content: [{ type: 'text', text: `Order ${orderId} is now ${status}` }] };
        }
    );

    return server;
}


void serveStdio(createServer);
console.error('ShopCo MCP server running on stdio');