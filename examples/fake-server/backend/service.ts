/// <reference types="node" />
import { randomUUID } from 'node:crypto';
import * as z from 'zod/v4';
import { customers, documents, orders, outbox, type Customer, type Document, type Email, type OrderStatus } from './data.js';

export class NotFoundError extends Error {}

export function getOrderStatus(orderId: string): { orderId: string; status: OrderStatus } {
    const order = orders.get(orderId);
    if (!order) throw new NotFoundError(`Order ${orderId} not found`);
    return { orderId: order.orderId, status: order.status };
}

export function deleteOrder(orderId: string): void {
    if (!orders.delete(orderId)) throw new NotFoundError(`Order ${orderId} not found`);
}

export function cancelOrder(orderId: string): { orderId: string; status: OrderStatus } {
    const order = orders.get(orderId);
    if (!order) throw new NotFoundError(`Order ${orderId} not found`);
    order.status = 'cancelled';
    return { orderId: order.orderId, status: order.status };
}

export function listCustomerOrders(customerId: string): { orderId: string; status: OrderStatus }[] {
    if (!customers.has(customerId)) throw new NotFoundError(`Customer ${customerId} not found`);
    return [...orders.values()]
        .filter(order => order.customerId === customerId)
        .map(({ orderId, status }) => ({ orderId, status }));
}

export function getShippingOptions(): { name: string; days: string; price: number }[] {
    return [
        { name: 'standard', days: '3-5', price: 0 },
        { name: 'express', days: '1-2', price: 15 }
    ];
}

export function getCustomer(customerId: string): Customer {
    const customer = customers.get(customerId);
    if (!customer) throw new NotFoundError(`Customer ${customerId} not found`);
    return customer;
}

export function getDocumentsList(): { id: string; name: string }[] {
    return documents.map(({ id, name }) => ({ id, name }));
}

export function readDocument(idOrName: string): Document {
    const key = idOrName.toLowerCase();
    const doc = documents.find(d => d.id.toLowerCase() === key || d.name.toLowerCase() === key);
    if (!doc) throw new NotFoundError(`Document ${idOrName} not found`);
    return doc;
}

export const SendEmailInput = z.object({
    to: z.email(),
    subject: z.string().min(1),
    body: z.string()
});

export function sendEmail(input: z.input<typeof SendEmailInput>): Email {
    const { to, subject, body } = SendEmailInput.parse(input);
    const email = { id: randomUUID(), to, subject, body, sentAt: new Date().toISOString() };
    outbox.push(email);
    console.error(`[email] to=${to} subject="${subject}"`);
    return email;
}
