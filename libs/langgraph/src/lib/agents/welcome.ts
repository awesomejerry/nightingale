import { tool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent, createReactAgentAnnotation } from '@langchain/langgraph/prebuilt';
import { z } from 'zod';

// Minimal WelcomeAgent that provides a greeting
export class WelcomeAgent {
  private agent: ReturnType<typeof createReactAgent>;

  constructor(apiKey?: string) {
    // Initialize OpenAI chat model
    const llm = new ChatOpenAI({ model: 'gpt-4o-mini', openAIApiKey: apiKey ?? process.env.OPENAI_API_KEY });
    // Define a simple tool for greeting
    const greetTool = tool(
      async ({ name }: { name: string }) => `Welcome to nightingale, ${name}!`,
      {
        name: 'greet',
        description: 'Generate a welcome greeting for a user when a human name is provided.', // Updated description
        schema: z.object({ name: z.string().describe('Name of the user') }),
      }
    );

    // Define the new tool for asking for a name
    const askForNameTool = tool(
      async () => "I'm designed to greet humans. Could you please tell me your name?",
      {
        name: 'askForName',
        description: "Use this tool to ask for the user's name if the provided input does not seem to be a human name (e.g., 'Robot', 'AI', 'Anonymous') or if a name is clearly missing.",
        schema: z.object({}), // No input parameters for this tool
      }
    );

    // Create an annotation and agent using LangGraph prebuilt React agent interface
    const annotation = createReactAgentAnnotation();
    this.agent = createReactAgent({
      llm,
      tools: [greetTool, askForNameTool], // Added askForNameTool
      stateSchema: annotation
    });
  }

  async greet(name: string): Promise<string> {
    const result = await this.agent.invoke({ messages: [{ role: 'user', content: name }] });
    const msgs = result.messages;
    const last = msgs[msgs.length - 1];
    return last?.content ?? '';
  }
}