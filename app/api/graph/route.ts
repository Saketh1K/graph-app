import { NextResponse } from 'next/server';
import { getDb } from '@/lib/gemini';

export async function GET() {
  try {
    const client = getDb();

    // Fetch a sample of flow: SO -> Delivery -> Billing -> Journal
    // We'll limit it to 20 sales orders to avoid overloading the initial view
    const soResult = await client.execute('SELECT salesOrder, soldToParty FROM SalesOrderHeaders LIMIT 20');
    const salesOrders = soResult.rows as unknown as { salesOrder: string; soldToParty: string }[];
    
    const nodes: { id: string; label: string; type: string; color: string }[] = [];
    const links: { source: string; target: string; label: string }[] = [];
    const nodeIds = new Set<string>();

    for (const so of salesOrders) {
      const soId = `SO-${so.salesOrder}`;
      if (!nodeIds.has(soId)) {
        nodes.push({ id: soId, label: `Order ${so.salesOrder}`, type: 'Order', color: '#3b82f6' });
        nodeIds.add(soId);
      }

      // Find deliveries for this SO
      const delResult = await client.execute({
        sql: 'SELECT DISTINCT deliveryDocument FROM DeliveryItems WHERE referenceSdDocument = ?',
        args: [so.salesOrder]
      });
      const deliveries = delResult.rows as unknown as { deliveryDocument: string }[];

      for (const del of deliveries) {
        const delId = `DEL-${del.deliveryDocument}`;
        if (!nodeIds.has(delId)) {
          nodes.push({ id: delId, label: `Delivery ${del.deliveryDocument}`, type: 'Delivery', color: '#10b981' });
          nodeIds.add(delId);
        }
        links.push({ source: soId, target: delId, label: 'delivered' });

        // Find billing for this delivery
        const billResult = await client.execute({
          sql: 'SELECT DISTINCT billingDocument FROM BillingItems WHERE referenceSdDocument = ?',
          args: [del.deliveryDocument]
        });
        const billings = billResult.rows as unknown as { billingDocument: string }[];

        for (const bill of billings) {
          const billId = `BILL-${bill.billingDocument}`;
          if (!nodeIds.has(billId)) {
            nodes.push({ id: billId, label: `Billing ${bill.billingDocument}`, type: 'Billing', color: '#f59e0b' });
            nodeIds.add(billId);
          }
          links.push({ source: delId, target: billId, label: 'billed' });

          // Find journal entries for this billing
          const jrResult = await client.execute({
            sql: 'SELECT DISTINCT accountingDocument FROM JournalEntries WHERE referenceDocument = ?',
            args: [bill.billingDocument]
          });
          const journals = jrResult.rows as unknown as { accountingDocument: string }[];

          for (const jr of journals) {
            const jrId = `JR-${jr.accountingDocument}`;
            if (!nodeIds.has(jrId)) {
              nodes.push({ id: jrId, label: `Journal ${jr.accountingDocument}`, type: 'JournalEntry', color: '#ef4444' });
              nodeIds.add(jrId);
            }
            links.push({ source: billId, target: jrId, label: 'posted' });
          }
        }
      }
    }

    return NextResponse.json({ nodes, links });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Graph API Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
