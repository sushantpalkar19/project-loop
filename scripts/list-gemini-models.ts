/**
 * Project LOOP — List Gemini Models via REST API
 *
 * This script calls the Google Generative AI REST API to list available models.
 */

import "dotenv/config";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY is not set in environment variables");
  process.exit(1);
}

const apiKeySafe: string = apiKey;

async function main() {
  console.log("🔍 Fetching available models from Google Generative AI API...\n");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKeySafe}`
    );

    if (!response.ok) {
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(`Response: ${text}`);
      process.exit(1);
    }

    const data = await response.json();
    
    console.log("=".repeat(60));
    console.log("AVAILABLE GEMINI MODELS");
    console.log("=".repeat(60) + "\n");
    
    if (!data.models || data.models.length === 0) {
      console.log("No models found.");
      process.exit(0);
    }

    console.log(`Total models: ${data.models.length}\n`);
    
    // Group by supported methods
    const generationModels = data.models.filter((m: any) => 
      m.supportedGenerationMethods?.includes("generateContent")
    );
    
    const embeddingModels = data.models.filter((m: any) => 
      m.supportedGenerationMethods?.includes("embedContent")
    );
    
    console.log("=".repeat(60));
    console.log("GENERATION MODELS (generateContent)");
    console.log("=".repeat(60) + "\n");
    
    if (generationModels.length === 0) {
      console.log("⚠️  NO GENERATION MODELS AVAILABLE FOR THIS API KEY");
      console.log("   This API key may only support embeddings.\n");
    } else {
      generationModels.forEach((model: any) => {
        console.log(`Name: ${model.name}`);
        console.log(`Display Name: ${model.displayName}`);
        console.log(`Description: ${model.description}`);
        console.log(`Methods: ${model.supportedGenerationMethods?.join(", ")}`);
        console.log("-".repeat(60));
      });
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("EMBEDDING MODELS (embedContent)");
    console.log("=".repeat(60) + "\n");
    
    embeddingModels.forEach((model: any) => {
      console.log(`Name: ${model.name}`);
      console.log(`Display Name: ${model.displayName}`);
      console.log(`Methods: ${model.supportedGenerationMethods?.join(", ")}`);
      console.log("-".repeat(60));
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
