import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient, Client } from '@libsql/client';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

let client: Client | null = null;

export function getDb() {
  if (!client) {
    const dbPath = path.join(process.cwd(), 'data', 'graph.db');
    client = createClient({
      url: `file:${dbPath}`,
    });
  }
  return client;
}

export async function generateSql(query: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
    You are an expert SQL assistant for an SAP Order-to-Cash system.
    Database Schema:
    - SalesOrderHeaders (salesOrder, soldToParty, creationDate, overallDeliveryStatus, totalNetAmount)
    - SalesOrderItems (salesOrder, salesOrderItem, material, orderQuantity)
    - DeliveryHeaders (deliveryDocument, shippingPoint, deliveryDate)
    - DeliveryItems (deliveryDocument, deliveryItem, material, actualDeliveryQuantity, referenceSdDocument)
    - BillingHeaders (billingDocument, billingDocumentType, billingDate, totalNetAmount)
    - BillingItems (billingDocument, billingDocumentItem, material, referenceSdDocument)
    - JournalEntries (accountingDocument, fiscalYear, companyCode, referenceDocument)

    Relationships:
    - DeliveryItems.referenceSdDocument = SalesOrderHeaders.salesOrder
    - BillingItems.referenceSdDocument = DeliveryHeaders.deliveryDocument
    - JournalEntries.referenceDocument = BillingHeaders.billingDocument

    Task:
    Translate the user's natural language question into a SQLite SQL query.
    - Only return the SQL query, nothing else.
    - If the question is NOT about O2C data, return "GUARDRAIL_REJECT".
    - Use JOINs to trace the flow (e.g., SO -> Delivery -> Billing).

    Question: "${query}"
  `;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text().trim().replace(/```sql|```/g, '');
}

export async function summarizeResults(query: string, results: Record<string, unknown>[]) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
    You are an assistant reporting data from an SAP system.
    User Question: "${query}"
    Data Results: ${JSON.stringify(results)}

    Task:
    - Provide a concise, professional summary of the data.
    - If there are many results, highlight the key points.
    - Mention document numbers and dates where relevant.
    - Use a friendly but business-oriented tone.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
