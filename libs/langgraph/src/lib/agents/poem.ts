import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent, createReactAgentAnnotation } from '@langchain/langgraph/prebuilt';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// PoemAgent implemented using React Agent pattern (similar to WelcomeAgent)
export class PoemAgent {
  private agent: ReturnType<typeof createReactAgent>;
  private llm: ChatOpenAI;

  constructor(apiKey?: string) {
    // Initialize OpenAI chat model
    this.llm = new ChatOpenAI({ 
      model: 'gpt-4o-mini', 
      openAIApiKey: apiKey ?? process.env.OPENAI_API_KEY,
      temperature: 0.7 // Better for creative tasks like poetry
    });
    
    // Define a tool for creating the welcome poem
    const composePoemTool = tool(
      async ({ content }: { content: string }) => {
        try {
          // Use the LLM to generate a poem based on the greeting content
          const result = await this.llm.invoke([
            { role: 'system', content: 'You are a skilled poet who creates cheerful welcome poems.' },
            { role: 'user', content: `Create a short welcome poem based on this greeting: "${content}". The poem should be cheerful, welcoming, and no more than 4-6 lines.` }
          ]);
          return result.content;
        } catch (error: any) {
          return `Failed to compose a poem: ${error.message}`;
        }
      },
      {
        name: 'composePoem',
        description: 'Generate a welcome poem for a user\'s greeting.',
        schema: z.object({ content: z.string().describe('Greeting content') }),
      }
    );

    // Create an agent using LangGraph prebuilt React agent interface
    const annotation = createReactAgentAnnotation();
    this.agent = createReactAgent({
      llm: this.llm,
      tools: [composePoemTool],
      stateSchema: annotation
    });
  }

  async composePoem(greeting: string): Promise<string> {
    try {
      const result = await this.agent.invoke({ messages: [{ role: 'user', content: `Create a welcome poem for "${greeting}"` }] });
      const msgs = result.messages;
      const last = msgs[msgs.length - 1];
      return last?.content ?? 'Could not generate a poem.';
    } catch (e: any) {
      return `An unexpected error occurred: ${e.message}`;
    }
  }
}
