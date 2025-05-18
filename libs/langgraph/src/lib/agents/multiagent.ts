import { ChatOpenAI } from '@langchain/openai';
import { StateGraph } from '@langchain/langgraph';
import { RunnableConfig } from '@langchain/core/runnables';
import { MessagesPlaceholder, ChatPromptTemplate } from '@langchain/core/prompts';
import { Annotation } from '@langchain/langgraph';
import { WelcomeAgent } from './welcome.js';
import { PoemAgent } from './poem.js';

// Define the state interface using Annotation
const AgentStateAnnotation = Annotation.Root({
  messages: Annotation<Array<{ role: string; content: string }>>({
    reducer: (existing, newVal) => {
      // Handle both array and single message cases
      if (Array.isArray(newVal)) {
        return [...existing, ...newVal];
      } else if (newVal) {
        return [...existing, newVal];
      }
      return existing;
    },
    default: () => [],
  }),
  greeting: Annotation<string>({
    reducer: (_, newVal) => newVal || "",
    default: () => "",
  }),
  poem: Annotation<string>({
    reducer: (_, newVal) => newVal || "",
    default: () => "",
  }),
  next: Annotation<string>({
    reducer: (_, newVal) => newVal || "",
    default: () => "",
  }),
});

// For type safety
type AgentState = typeof AgentStateAnnotation.State;

// Define event callback type
export type AgentEventCallback = (step: string, message: string) => void;

export class MultiAgent {
  private graph: any; // Using any temporarily to avoid complex typing
  private welcomeAgent: WelcomeAgent;
  private poemAgent: PoemAgent;

  constructor(apiKey?: string) {
    this.welcomeAgent = new WelcomeAgent(apiKey);
    this.poemAgent = new PoemAgent(apiKey);

    // Create the coordinator agent which will decide next steps
    const llm = new ChatOpenAI({ 
      model: 'gpt-4o-mini', 
      openAIApiKey: apiKey ?? process.env.OPENAI_API_KEY 
    });

    const coordinatorPrompt = ChatPromptTemplate.fromMessages([
      ["system", "You are a coordinator agent that determines the next step in a conversation flow."],
      new MessagesPlaceholder("messages"),
      ["user", 
       "Based on the conversation, decide which agent should act next:\n" +
       "- 'welcomeAgent': Get a welcome greeting for the user\n" +
       "- 'poemAgent': Create a poem based on the greeting\n" +
       "- 'complete': End the conversation if greeting and poem are made\n\n" +
       "Reply with just one word: 'welcome', 'poem', or 'complete'."
      ]
    ]);

    const coordinator = coordinatorPrompt.pipe(llm);

    // Define node functions
    const coordinatorNode = async (state: AgentState) => {
      try {
        // Default to welcoming if this is the first interaction
        if (state.messages.length === 1 && state.messages[0].role === 'user') {
          return {
            next: 'welcomeAgent'
          };
        }

        // If we have a greeting but no poem yet, suggest poem as the next step
        if (state.greeting && !state.poem) {
          return {
            next: 'poemAgent'
          };
        }

        
        // Otherwise use the LLM to decide
        const result = await coordinator.invoke({
          messages: state.messages
        });

        // Handle different types of message content
        let decision = "";
        if (typeof result.content === 'string') {
          decision = result.content.toLowerCase().trim();
        } else if (Array.isArray(result.content)) {
          // Handle array of content
          const textContent = result.content
            .filter((item: any) => item.type === 'text')
            .map((item: any) => item.text)
            .join(" ");
          decision = textContent.toLowerCase().trim();
        }

        // Validate the decision
        if (decision.includes('welcome')) {
          return { next: 'welcomeAgent' };
        } else if (decision.includes('poem')) {
          return { next: 'poemAgent' };
        } else if (decision.includes('complete')) {
          return { next: 'complete' };
        }
        
        // If we have both greeting and poem, default to complete
        if (state.greeting && state.poem) {
          return { next: 'complete' };
        }
        
        // Otherwise default to welcome
        return { next: 'welcomeAgent' };
      } catch (error) {
        console.error('Error in coordinator node:', error);
        return { next: 'complete' };
      }
    };

    const welcomeNode = async (state: AgentState) => {
      try {
        // Extract the user's name from the last user message
        const userMessage = state.messages
          .filter((m) => m.role === 'user')
          .pop()?.content || 'User';
        
        // Get greeting from welcome agent
        const greeting = await this.welcomeAgent.greet(userMessage);
        
        if (!greeting) {
          throw new Error("Failed to generate greeting");
        }
        
        return {
          greeting,
          messages: [{ role: 'assistant', content: greeting }]
        };
      } catch (error) {
        console.error('Error in welcome node:', error);
        // Fallback greeting
        const fallbackGreeting = "Welcome! It's nice to meet you.";
        
        return {
          greeting: fallbackGreeting,
          messages: [{ role: 'assistant', content: fallbackGreeting }]
        };
      }
    };

    const poemNode = async (state: AgentState) => {
      try {
        // Check if we have a greeting to create a poem from
        if (!state.greeting) {
          return {
            messages: [{ role: 'assistant', content: "I need a greeting first before creating a poem." }]
          };
        }
        
        // Get poem from poem agent
        const poem = await this.poemAgent.composePoem(state.greeting);
        
        if (!poem) {
          throw new Error("Failed to generate poem");
        }
        
        return {
          poem,
          messages: [{ role: 'assistant', content: poem }]
        };
      } catch (error) {
        console.error('Error in poem node:', error);
        // Return a fallback poem on error
        const fallbackPoem = "Words may sometimes fail,\nBut greetings still remain.\nWelcome to our world,\nWhere connections sustain.";
        
        return {
          poem: fallbackPoem,
          messages: [{ role: 'assistant', content: fallbackPoem }]
        };
      }
    };

    // Create a graph with manually constructed definition that avoids using the problematic API
    const workflow = new StateGraph(AgentStateAnnotation)
      .addNode("coordinator", coordinatorNode)
      .addNode("welcomeAgent", welcomeNode)
      .addNode("poemAgent", poemNode);
    
    // Define edges
    workflow.addEdge("__start__", "coordinator");
    workflow.addEdge("welcomeAgent", "coordinator");
    workflow.addEdge("poemAgent", "coordinator");

    // Add conditional edges with function
    const routeFromCoordinator = (state: AgentState) => {
      if (state.next === "welcomeAgent") return "welcomeAgent";
      if (state.next === "poemAgent") return "poemAgent";
      return "__end__"; // Use string literal instead of END constant
    };

    workflow.addConditionalEdges("coordinator", routeFromCoordinator);

    // Compile the graph
    this.graph = workflow.compile();
  }

  async run(userInput: string): Promise<typeof AgentStateAnnotation.State> {
    try {
      // Initialize conversation state with user input
      const initialState = {
        messages: [{ role: 'user', content: userInput }]
      };

      const config: RunnableConfig = {
        recursionLimit: 25 // Prevent infinite loops
      };
      
      // Invoke the graph with the initial state
      return await this.graph.invoke(initialState, config);
    } catch (error) {
      console.error('Error in MultiAgent workflow:', error);
      throw error;
    }
  }

  async runWithEvents(userInput: string, onEvent: AgentEventCallback): Promise<typeof AgentStateAnnotation.State> {
    try {
      // Notify that we're starting
      onEvent('start', `Processing request: "${userInput}"`);

      // Initialize conversation state with user input
      const initialState = {
        messages: [{ role: 'user', content: userInput }]
      };

      // Use the streamEvents method from LangGraph to properly get event streams
      // This allows us to tap into the graph execution events
      const eventStream = this.graph.streamEvents(initialState, { version: "v2" });
      
      // Process each event as it occurs and create our custom events
      let finalResult: typeof AgentStateAnnotation.State = initialState as any;
      
      for await (const evt of eventStream) {
        try {
          switch (evt.event) {
            // Node entry and exit events  
            case "on_chain_start":
            case "on_node_start":
              if (evt.name) {
                const nodeName = evt.name;
                switch (nodeName) {
                  case 'coordinator':
                    onEvent('coordinator', 'Determining next action...');
                    break;
                  case 'welcomeAgent':
                    onEvent('welcomeAgent', 'Generating welcome greeting...');
                    break;
                  case 'poemAgent':
                    onEvent('poemAgent', 'Creating poem based on greeting...');
                    break;
                }
              }
              break;
              
            case "on_node_end":
              if (evt.name && evt.data?.state) {
                const nodeName = evt.name;
                const state = evt.data.state;
                
                switch (nodeName) {
                  case 'coordinator':
                    if (state.next) {
                      onEvent('coordinator', `Decided next step: ${state.next}`);
                    }
                    break;
                  case 'welcomeAgent':
                    if (state.greeting) {
                      onEvent('welcomeAgent', state.greeting);
                    }
                    break;
                  case 'poemAgent':
                    if (state.poem) {
                      onEvent('poemAgent', state.poem);
                    }
                    break;
                }
                
                // Always update our final result
                finalResult = state;
              }
              break;
            case "on_chain_end":
                finalResult = evt.data.output;
                break;
              
            // LLM events
            case "on_llm_start":
              if (evt.name) {
                onEvent(evt.name, `${evt.name} is thinking...`);
              } else {
                onEvent('thinking', 'Agent is processing...');
              }
              break;
              
            case "on_llm_stream":
              if (evt.data?.chunk) {
                onEvent('stream', `Agent is generating: ${evt.data.chunk}`);
              }
              break;
          }
        } catch (err) {
          // Ignore errors in event processing
          console.error('Error processing event:', err);
        }
      }
      
      return finalResult;
    } catch (error) {
      console.error('Error in MultiAgent workflow:', error);
      onEvent('error', `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}
