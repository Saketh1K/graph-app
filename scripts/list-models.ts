import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  try {
    const result = await genAI.listModels();
    console.log('Available Models:');
    result.models.forEach(model => {
      console.log(`- ${model.name} (DisplayName: ${model.displayName})`);
    });
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();
