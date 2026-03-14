import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const MODEL = "gpt-5.2";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const prompt = process.argv.slice(2).join(" ");

async function run() {

    if (!prompt) {
        console.log("Usage: node codex.js <your prompt>");
        process.exit(0);
    }

    console.log("Using model:", MODEL);

    const response = await client.responses.create({
        model: MODEL,
        input: prompt
    });

    console.log("\nAI Response:\n");
    console.log(response.output_text);
}

run();