import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function test() {
  const modelsToTest = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.0-pro',
    'gemini-pro'
  ];

  for (const modelName of modelsToTest) {
    try {
      console.log(`\n--- Testing ${modelName} ---`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hello');
      console.log(`${modelName} is working!`);
      console.log('Response:', result.response.text());
      return; // Stop if we find one
    } catch (e: any) {
      console.error(`${modelName} failed:`, e.status, e.statusText);
    }
  }
}

test();
