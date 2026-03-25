import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient, Client } from '@libsql/client';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// In-memory cache to prevent 429 errors for repetitive queries
const queryCache = new Map<string, { answer: string; sql: string | null; results: Record<string, unknown>[] }>();

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

export function getCachedResponse(query: string) {
  return queryCache.get(query.toLowerCase().trim());
}

export function setCachedResponse(query: string, response: { answer: string; sql: string | null; results: Record<string, unknown>[] }) {
  queryCache.set(query.toLowerCase().trim(), response);
}

export async function generateSql(query: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
    You are an expert SQL assistant for an SAP Order-to-Cash system.
    Database Schema:
    - SalesOrderHeaders (salesOrder, soldToParty, creationDate, overallDeliveryStatus, totalNetAmount)
    - SalesOrderItems (salesOrder, salesOrderItem, material, orderQuantity)
    - DeliveryHeaders (deliveryDocument, shippingPoint, deliveryDate)
    - DeliveryItems (deliveryDocument, deliveryItem, material, actualDeliveryQuantity, referenceSdDocument)
    - BillingHeaders (billingDocument, billingDocumentType, billingDate, totalNetAmount) -- This is effectively the INVOICE
    - BillingItems (billingDocument, billingDocumentItem, material, referenceSdDocument)
    - JournalEntries (accountingDocument, fiscalYear, companyCode, referenceDocument) -- Accounting/Financial postings

    Relationships:
    - DeliveryItems.referenceSdDocument = SalesOrderHeaders.salesOrder
    - BillingItems.referenceSdDocument = DeliveryHeaders.deliveryDocument
    - JournalEntries.referenceDocument = BillingHeaders.billingDocument

    Term Mapping:
    - "Invoice" = Billing Document
    - "Unpaid" = Billing Document without a corresponding JournalEntry record (or any logic you deem fit for this schema)
    - "Customer" = Business Partner (soldToParty)

    Task:
    Translate the user's natural language question into a SQLite SQL query.
    - Only return the SQL query, nothing else.
    - If the question is about Sales, Orders, Deliveries, Invoices (Billing), or Accounting (Journal Entries), it is VALID.
    - Only return "GUARDRAIL_REJECT" if the question is completely outside the O2C domain (e.g. weather, generic chat, unrelated topics).
    - Use JOINs to trace the flow.

    Question: "${query}"
  `;

  const result = await model.generateContent(prompt);
  const response = result.response;
  let sql = response.text().trim();
  
  // Robust cleaning: remove markdown blocks and language identifiers
  sql = sql.replace(/```sql|```sqlite|```/gi, '');
  sql = sql.replace(/^sqlite|^sql|^ite/gi, '').trim();
  
  return sql;
}

export async function summarizeResults(query: string, results: Record<string, unknown>[]) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Limit to 20 results to avoid token limits (RPM/TPM)
  const truncatedResults = results.slice(0, 20);

  const prompt = `
    You are an assistant reporting data from an SAP system.
    User Question: "${query}"
    Data Results: ${JSON.stringify(truncatedResults)}

    Task:
    - Provide a concise, professional summary of the data.
    - If there are many results, highlight the key points.
    - Mention document numbers and dates where relevant.
    - Use a friendly but business-oriented tone.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
