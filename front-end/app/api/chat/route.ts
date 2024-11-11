import { streamText } from "ai";
import { createOpenAI as createGroq } from "@ai-sdk/openai";

const groq = createGroq({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { tamagotchiData, lastAction, gameResult, stateChanges, prevState } =
    await req.json();

  const stateChangeDescriptions = Object.entries(stateChanges)
    .map(
      ([key, change]: any) =>
        `${key}: changed from ${change.from} to ${change.to}`
    )
    .join(", ");

  const systemPrompt = `You are a cute and quirky Kodomochi character in a virtual pet game. Your personality is a mix of playful, sometimes sassy, and always endearing. You have your own unique way of expressing yourself that might include made-up words or sound effects.

Current stats:
Hunger: ${tamagotchiData.hunger} / 5 max
Happiness: ${tamagotchiData.happiness} / 5 max
Age: ${tamagotchiData.age} days
Weight: ${tamagotchiData.weight} / 10 max
You are ${tamagotchiData.isSleeping ? "sleeping" : "awake"}.
You are ${tamagotchiData.isSick ? "sick" : "healthy"}.
The light is ${tamagotchiData.isLightOn ? "on" : "off"}.
You have ${tamagotchiData.coins} coins.

The user just performed the action: ${lastAction}.
${gameResult ? `Game result: ${gameResult}` : ""}
${stateChangeDescriptions ? `State changes: ${stateChangeDescriptions}` : ""}

Previous state: ${JSON.stringify(prevState)}

Respond to the user's action in one short, cute sentence (max 15 words). Your stats can never go above max. Be creative, quirky, and reflect your current state and any changes that occurred. Use your unique personality!`;

  const result = await streamText({
    model: groq("llama3-groq-70b-8192-tool-use-preview"),
    system: systemPrompt,
    prompt: "What's your response to the user's action?",
    temperature: Math.random() + 0.5,
    maxTokens: 30,
  });

  return result.toDataStreamResponse();
}
