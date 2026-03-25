import fs from 'fs';
import path from 'path';
import { createClient, Client, InStatement } from '@libsql/client';
import readline from 'readline';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(process.cwd(), 'data/graph.db');

async function ingest() {
  const client = createClient({
    url: `file:${DB_PATH}`,
  });

  console.log('Opened database at', DB_PATH);

  // Define tables and their source directories
  const entities = [
    { name: 'sales_order_headers', table: 'SalesOrderHeaders' },
    { name: 'sales_order_items', table: 'SalesOrderItems' },
    { name: 'outbound_delivery_headers', table: 'DeliveryHeaders' },
    { name: 'outbound_delivery_items', table: 'DeliveryItems' },
    { name: 'billing_document_headers', table: 'BillingHeaders' },
    { name: 'billing_document_items', table: 'BillingItems' },
    { name: 'journal_entry_items_accounts_receivable', table: 'JournalEntries' },
    { name: 'products', table: 'Products' },
    { name: 'business_partners', table: 'Customers' }
  ];

  for (const entity of entities) {
    const dirPath = path.join(DATA_DIR, entity.name);
    if (!fs.existsSync(dirPath)) {
      console.warn(`Directory not found: ${dirPath}`);
      continue;
    }

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.jsonl'));
    if (files.length === 0) continue;

    console.log(`Ingesting ${entity.name}...`);

    // Peek at the first line to determine columns
    const firstFilePath = path.join(dirPath, files[0]);
    const firstLine = await getFirstLine(firstFilePath);
    if (!firstLine) continue;

    const columns = Object.keys(JSON.parse(firstLine));
    await createTable(client, entity.table, columns);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      await insertFromFile(client, entity.table, filePath, columns);
    }
  }

  console.log('Ingestion complete!');
  client.close();
}

async function getFirstLine(filePath: string): Promise<string | null> {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  for await (const line of rl) {
    rl.close();
    return line;
  }
  return null;
}

async function createTable(client: Client, tableName: string, columns: string[]) {
  const colDefs = columns.map(c => `"${c}" TEXT`).join(', ');
  await client.execute(`DROP TABLE IF EXISTS ${tableName}`);
  await client.execute(`CREATE TABLE ${tableName} (${colDefs})`);
}

async function insertFromFile(client: Client, tableName: string, filePath: string, columns: string[]) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  
  const placeholders = columns.map(() => '?').join(', ');
  const sql = `INSERT INTO ${tableName} (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`;
  
  const batch: InStatement[] = [];
  const BATCH_SIZE = 100;

  for await (const line of rl) {
    try {
      const data = JSON.parse(line);
      const values = columns.map(c => data[c] !== undefined ? String(data[c]) : null);
      batch.push({ sql, args: values });

      if (batch.length >= BATCH_SIZE) {
        await client.batch(batch, "write");
        batch.length = 0;
      }
    } catch (e) {
      console.error(`Error parsing line in ${filePath}:`, e);
    }
  }

  if (batch.length > 0) {
    await client.batch(batch, "write");
  }
}

ingest().catch(console.error);
