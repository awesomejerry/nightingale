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
  lastCoordinatorDecision: Annotation<string>({
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
      model: 'gpt-4o',
      openAIApiKey: apiKey ?? process.env.OPENAI_API_KEY
    });

    const coordinatorPrompt = ChatPromptTemplate.fromMessages([
      ["system",
        "You are a coordinator agent. Your role is to analyze the full conversation history provided in 'messages' and decide the current state of the conversation. " +
        "You must reply with only one of the specified keywords. Follow the logic conditions strictly."
      ],
      new MessagesPlaceholder("messages"),
      ["user",
        "Carefully analyze the provided 'messages' history. Based on this analysis, determine the current state of the conversation by following these conditions in order. Reply with a single keyword ONLY.\n\n" +

        "1. **Is Clarification Needed?**\n" +
        "   - Examine the VERY LAST message in the 'messages' history.\n" +
        "   - IF the last message is from an 'assistant' AND it is an EXPLICIT question to the user (e.g., 'What is your name?', 'What topic do you want for the poem?'),\n" +
        "   THEN reply with `NEEDS_CLARIFICATION`.\n\n" +

        "2. **Does the Conversation Need a Welcome Greeting?** (Only check if condition 1 is NOT met)\n" +
        "   - Count how many messages from an 'assistant' in the 'messages' history appear to be a greeting (e.g., contain 'hello', 'welcome', 'hi there', 'nice to meet you', 'greetings').\n" +
        "   - IF there are ZERO such 'assistant' greeting messages, OR IF the entire 'messages' history consists of only ONE message AND that message is from the 'user',\n" +
        "   THEN reply with `NEEDS_WELCOME`.\n\n" +

        "3. **Is a Poem Due?** (Only check if conditions 1 and 2 are NOT met)\n" +
        "   - (This implies a greeting from an 'assistant' IS present in the history and no clarification is needed).\n" +
        "   - Count how many messages from an 'assistant' in the 'messages' history appear to contain a completed poem (look for multiple lines, thematic words, or phrases like 'here is your poem').\n" +
        "   - IF there are ZERO such 'assistant' messages containing a poem,\n" +
        "   THEN reply with `NEEDS_POEM`.\n\n" +

        "4. **Is the Conversation Complete?** (Only check if conditions 1, 2, and 3 are NOT met)\n" +
        "   - (This implies no clarification is needed, an 'assistant' greeting IS present, and an 'assistant' poem IS present in the history).\n" +
        "   THEN reply with `IS_COMPLETE`.\n\n" +

        "Reply with only one of these keywords: `NEEDS_CLARIFICATION`, `NEEDS_WELCOME`, `NEEDS_POEM`, `IS_COMPLETE`."
      ]
    ]);

    const coordinator = coordinatorPrompt.pipe(llm);

    // Define node functions
    const coordinatorNode = async (state: AgentState) => {
      try {
        console.log("Coordinator: Current state messages:", JSON.stringify(state.messages, null, 2));

        // Invoke the LLM (which is coordinatorPrompt.pipe(llm))
        const result = await coordinator.invoke({
          messages: state.messages
        });
        console.log("Coordinator: LLM raw output:", JSON.stringify(result, null, 2));

        // Parse the LLM's string output
        let parsedDecision = "";
        if (typeof result.content === 'string') {
          parsedDecision = result.content.replace(/`/g, "").toUpperCase().trim();
        } else if (Array.isArray(result.content)) {
          // Handle array of content if necessary, though current prompt expects a single keyword
          const textContent = result.content
            .filter((item: any) => item.type === 'text')
            .map((item: any) => item.text.replace(/`/g, "").toUpperCase().trim())
            .join("");
          parsedDecision = textContent;
        }
        console.log("Coordinator: Parsed LLM decision:", parsedDecision);

        if (parsedDecision === 'NEEDS_WELCOME') {
          console.log("Coordinator: Routing to: welcomeAgent, Decision: NEEDS_WELCOME");
          return { next: 'welcomeAgent' };
        } else if (parsedDecision === 'NEEDS_POEM') {
          console.log("Coordinator: Routing to: poemAgent, Decision: NEEDS_POEM");
          return { next: 'poemAgent' };
        } else if (parsedDecision === 'NEEDS_CLARIFICATION') {
          console.log("Coordinator: Routing to: __end__, Decision: NEEDS_CLARIFICATION");
          return { next: '__end__', lastCoordinatorDecision: 'NEEDS_CLARIFICATION' };
        } else if (parsedDecision === 'IS_COMPLETE') {
          console.log("Coordinator: Routing to: __end__, Decision: IS_COMPLETE");
          return { next: '__end__', lastCoordinatorDecision: 'IS_COMPLETE' };
        } else {
          console.error("Coordinator: Unknown LLM decision:", parsedDecision, "Routing to __end__ as fallback.");
          console.log("Coordinator: Routing to: __end__, Decision:", parsedDecision);
          return { next: '__end__', lastCoordinatorDecision: parsedDecision };
        }
      } catch (error) {
        console.error('Error in coordinatorNode:', error);
        console.log("Coordinator: Error in coordinator, routing to __end__, Decision: COORDINATOR_ERROR");
        return { next: '__end__', lastCoordinatorDecision: 'COORDINATOR_ERROR' };
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

  async run(userInput: string): Promise<string | null> {
    try {
      // Initialize conversation state with user input
      const initialState: Partial<AgentState> = { // Use Partial<AgentState> for initial state
        messages: [{ role: 'user', content: userInput }]
      };

      const config: RunnableConfig = {
        recursionLimit: 25 // Prevent infinite loops
      };

      // Invoke the graph with the initial state
      const finalState = await this.graph.invoke(initialState, config) as AgentState; // Cast to AgentState

      console.log("MultiAgent.run: Final coordinator decision:", finalState.lastCoordinatorDecision);

      if (finalState.lastCoordinatorDecision === 'NEEDS_CLARIFICATION') {
        const lastMessage = finalState.messages[finalState.messages.length - 1];
        return lastMessage?.content || "Please provide more information.";
      } else if (finalState.lastCoordinatorDecision === 'IS_COMPLETE') {
        const lastAssistantMessage = finalState.messages.filter(m => m.role === 'assistant').pop();
        return lastAssistantMessage?.content || "The process is complete.";
      } else {
        // Handles empty, COORDINATOR_ERROR, or any other unknown decisions
        console.log("MultiAgent.run: Unhandled or error in coordinator decision:", finalState.lastCoordinatorDecision);
        return "An unexpected issue occurred."; // Or return null
      }
    } catch (error) {
      console.error('Error in MultiAgent.run workflow:', error);
      return "An error occurred during processing."; // Or return null
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
