import { NextRequest, NextResponse } from 'next/server';
import { generateSql, getDb, summarizeResults } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // 1. Generate SQL
    const sql = await generateSql(query);
    console.log('Generated SQL:', sql);

    if (sql.includes('GUARDRAIL_REJECT')) {
      return NextResponse.json({
        answer: "I'm sorry, I can only help with questions related to the SAP Order-to-Cash dataset (Orders, Deliveries, Billing, etc.). How can I help you explore the business data today?",
        sql: null
      });
    }

    // 2. Execute SQL
    const client = getDb();
    let results: Record<string, unknown>[] = [];
    try {
      const rs = await client.execute(sql);
      results = rs.rows as unknown as Record<string, unknown>[];
    } catch (dbError: unknown) {
      const message = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.error('SQL Execution Error:', dbError);
      return NextResponse.json({
        answer: "I encountered an error while querying the database. Please try rephrasing your question.",
        sql: sql,
        error: message
      });
    }

    // 3. Summarize results
    const answer = await summarizeResults(query, results);

    return NextResponse.json({
      answer,
      sql,
      results
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
