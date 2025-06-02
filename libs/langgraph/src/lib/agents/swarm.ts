import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { createSwarm, createHandoffTool } from "@langchain/langgraph-swarm";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const transferToHotelAssistant = createHandoffTool({
    agentName: "hotel_assistant",
    description: "Transfer user to the hotel-booking assistant.",
});

const transferToFlightAssistant = createHandoffTool({
    agentName: "flight_assistant",
    description: "Transfer user to the flight-booking assistant.",
});

const bookHotel = tool(
    async (input: { hotel_name: string }) => {
        return `Successfully booked a stay at ${input.hotel_name}.`;
    },
    {
        name: "book_hotel",
        description: "Book a hotel",
        schema: z.object({
            hotel_name: z.string().describe("The name of the hotel to book"),
        }),
    }
);

const bookFlight = tool(
    async (input: { from_airport: string; to_airport: string }) => {
        return `Successfully booked a flight from ${input.from_airport} to ${input.to_airport}.`;
    },
    {
        name: "book_flight",
        description: "Book a flight",
        schema: z.object({
            from_airport: z.string().describe("The departure airport code"),
            to_airport: z.string().describe("The arrival airport code"),
        }),
    }
);

const llm = new ChatOpenAI({ modelName: "gpt-4.1" });

const flightAssistant = createReactAgent({
    llm,
    tools: [bookFlight, transferToHotelAssistant],
    prompt: "You are a flight booking assistant",
    name: "flight_assistant",
});

const hotelAssistant = createReactAgent({
    llm,
    tools: [bookHotel, transferToFlightAssistant],
    prompt: "You are a hotel booking assistant",
    name: "hotel_assistant",
});

const swarm = createSwarm({
    agents: [flightAssistant, hotelAssistant],
    defaultActiveAgent: "flight_assistant",
}).compile();

export default async function runSwarmStream(request: string) {
    const stream = await swarm.stream({
        messages: [{
            role: "user",
            content: request,
        }]
    });

    return stream;
}