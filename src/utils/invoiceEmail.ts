export interface InvoiceEmailPayload<T> {
  order: T;
  sentAt: string;
}

const delay = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms);
});

export const sendInvoiceEmail = async <T extends object>(
  orderData: T
): Promise<InvoiceEmailPayload<T>> => {
  const payload: InvoiceEmailPayload<T> = {
    order: orderData,
    sentAt: new Date().toISOString(),
  };

  // Simulate a backend call to POST /api/send-invoice
  await delay(900);

  try {
    await fetch('/api/send-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Ignore network errors for the mock
  }

  return payload;
};
