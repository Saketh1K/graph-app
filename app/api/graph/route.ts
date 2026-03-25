import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/gemini';

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();

    // Fetch a sample of flow: SO -> Delivery -> Billing -> Journal
    // We'll limit it to 20 sales orders to avoid overloading the initial view
    const salesOrders = await db.all<{ salesOrder: string; soldToParty: string }[]>('SELECT salesOrder, soldToParty FROM SalesOrderHeaders LIMIT 20');
    
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
      const deliveries = await db.all('SELECT DISTINCT deliveryDocument FROM DeliveryItems WHERE referenceSdDocument = ?', [so.salesOrder]);
      for (const del of deliveries) {
        const delId = `DEL-${del.deliveryDocument}`;
        if (!nodeIds.has(delId)) {
          nodes.push({ id: delId, label: `Delivery ${del.deliveryDocument}`, type: 'Delivery', color: '#10b981' });
          nodeIds.add(delId);
        }
        links.push({ source: soId, target: delId, label: 'delivered' });

        // Find billing for this delivery
        const billings = await db.all('SELECT DISTINCT billingDocument FROM BillingItems WHERE referenceSdDocument = ?', [del.deliveryDocument]);
        for (const bill of billings) {
          const billId = `BILL-${bill.billingDocument}`;
          if (!nodeIds.has(billId)) {
            nodes.push({ id: billId, label: `Billing ${bill.billingDocument}`, type: 'Billing', color: '#f59e0b' });
            nodeIds.add(billId);
          }
          links.push({ source: delId, target: billId, label: 'billed' });

          // Find journal entries for this billing
          const journals = await db.all('SELECT DISTINCT accountingDocument FROM JournalEntries WHERE referenceDocument = ?', [bill.billingDocument]);
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
