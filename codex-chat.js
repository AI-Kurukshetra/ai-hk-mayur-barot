import OpenAI from "openai";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function chat() {

    rl.question("AI > ", async (prompt) => {

        if (prompt === "exit") {
            rl.close();
            return;
        }

        const response = await client.responses.create({
            model: "gpt-4.1",
            input: prompt
        });

        console.log("\n", response.output_text, "\n");

        chat();
    });

}

chat();