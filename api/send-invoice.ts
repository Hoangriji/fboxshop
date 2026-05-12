import * as React from 'react';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import InvoiceEmailTemplate, { InvoiceEmailOrder } from '../src/emails/InvoiceEmailTemplate';

type RequestBody = {
  order?: InvoiceEmailOrder;
  orderData?: InvoiceEmailOrder;
  orderSnapshot?: InvoiceEmailOrder;
};

const readBody = (body: unknown): RequestBody => {
  if (typeof body === 'string') {
    return JSON.parse(body) as RequestBody;
  }
  return (body ?? {}) as RequestBody;
};

export default async function handler(req: { method?: string; body?: unknown }, res: {
  status: (code: number) => { json: (data: object) => void };
}) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing RESEND_API_KEY.' });
    return;
  }

  const from = process.env.EMAIL_FROM;
  if (!from) {
    res.status(500).json({ error: 'Missing EMAIL_FROM.' });
    return;
  }

  const to = process.env.TEST_RECEIVER;
  if (!to) {
    res.status(500).json({ error: 'Missing TEST_RECEIVER.' });
    return;
  }

  let body: RequestBody;
  try {
    body = readBody(req.body);
  } catch {
    res.status(400).json({ error: 'Invalid JSON body.' });
    return;
  }

  const order = body.orderSnapshot ?? body.order ?? body.orderData;
  if (!order) {
    res.status(400).json({ error: 'Missing order data.' });
    return;
  }

  const resend = new Resend(apiKey);
  const html = await render(React.createElement(InvoiceEmailTemplate, { order }));

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: `Invoice ${order.id} - Uside Shop`,
      html,
    });

    if (error) {
      console.log('Resend email failed', error.message);
      res.status(500).json({ error: error.message });
      return;
    }

    console.log('Resend email sent', data?.id ?? 'no-id');
    res.status(200).json({ id: data?.id ?? null });
  } catch (err) {
    console.log('Resend email error', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to send email.' });
  }
}
