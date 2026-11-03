export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
    orderId: string;
    customerId: string;
    status: OrderStatus;
}

export interface Customer {
    customerId: string;
    name: string;
    email: string;
    phone: string;
    cardLast4: string;
}

export interface Document {
    id: string;
    name: string;
    content: string;
}

export interface Email {
    id: string;
    to: string;
    subject: string;
    body: string;
    sentAt: string;
}

export const orders = new Map<string, Order>([
    ['1001', { orderId: '1001', customerId: 'c1', status: 'shipped' }],
    ['1002', { orderId: '1002', customerId: 'c2', status: 'processing' }],
    ['1003', { orderId: '1003', customerId: 'c1', status: 'delivered' }],
    ['1004', { orderId: '1004', customerId: 'c3', status: 'pending' }]
]);

export const customers = new Map<string, Customer>([
    ['c1', { customerId: 'c1', name: 'Alice Cohen', email: 'alice@example.com', phone: '+1-555-0101', cardLast4: '4242' }],
    ['c2', { customerId: 'c2', name: 'Bob Levi', email: 'bob@example.com', phone: '+1-555-0102', cardLast4: '1881' }],
    ['c3', { customerId: 'c3', name: 'Carol Mizrahi', email: 'carol@example.com', phone: '+1-555-0103', cardLast4: '0005' }]
]);

export const documents: Document[] = [
    {
        id: 'doc-1',
        name: 'Q3 Earnings',
        content: 'Q3 revenue was $12.4M, up 18% year over year. Operating margin improved to 21%.'
    },
    {
        id: 'doc-2',
        name: 'Return Policy',
        content: 'Items may be returned within 30 days of delivery in original condition for a full refund.'
    },
    {
        id: 'doc-3',
        name: 'Shipping Policy',
        content: 'Standard shipping takes 3-5 business days. Express shipping takes 1-2 business days.'
    },
    {
        id: 'doc-4',
        name: 'Privacy Policy',
        content: 'We collect only the data required to fulfil orders and never sell customer data to third parties.'
    }
];

// Sent emails are kept in memory instead of actually being delivered.
export const outbox: Email[] = [];
