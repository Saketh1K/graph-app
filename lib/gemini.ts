import { GoogleGenerativeAI } from '@google/generative-ai';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const DB_PATH = path.join(process.cwd(), 'data/graph.db');

export const SCHEMA = `
-- SalesOrderHeaders (salesOrder, salesOrderType, soldToParty, totalNetAmount, transactionCurrency, overallDeliveryStatus, creationDate)
-- SalesOrderItems (salesOrder, salesOrderItem, material, requestedQuantity, netAmount, productionPlant)
-- DeliveryHeaders (deliveryDocument, creationDate, overallGoodsMovementStatus, shippingPoint)
-- DeliveryItems (deliveryDocument, deliveryDocumentItem, actualDeliveryQuantity, referenceSdDocument, referenceSdDocumentItem, plant)
-- BillingHeaders (billingDocument, billingDocumentType, creationDate, totalNetAmount, transactionCurrency, soldToParty, accountingDocument)
-- BillingItems (billingDocument, billingDocumentItem, material, billingQuantity, netAmount, referenceSdDocument, referenceSdDocumentItem)
-- JournalEntries (accountingDocument, fiscalYear, referenceDocument, customer, amountInTransactionCurrency, transactionCurrency)
-- Products (product, productType, productGroup)
-- Customers (businessPartner, businessPartnerCategory, firstName, lastName, organizationBPName1)
`;

export async function getDb() {
  return open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
}

export async function generateSql(query: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
    You are an expert SQL assistant for an SAP Order-to-Cash system.
    The database schema is as follows:
    ${SCHEMA}

    Relationships:
    - SalesOrderItems.salesOrder = SalesOrderHeaders.salesOrder
    - DeliveryItems.referenceSdDocument = SalesOrderHeaders.salesOrder
    - BillingItems.referenceSdDocument = DeliveryHeaders.deliveryDocument
    - JournalEntries.referenceDocument = BillingHeaders.billingDocument
    - SalesOrderHeaders.soldToParty links to Customers.businessPartner
    Return ONLY the SQL query, no markdown, no explanations.
    If the question is unrelated to the dataset or domain, return "GUARDRAIL_REJECT".

    User Question: "${query}"
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim().replace(/```sql|```/g, '');
}

export async function summarizeResults(query: string, results: Record<string, string | number | null>[]) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
    You are an assistant reporting data from an SAP system.
    The user asked: "${query}"
    The database returned the following results:
    ${JSON.stringify(results, null, 2)}

    Please provide a concise, professional answer based on the data.
    If no data was found, state that clearly.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}
