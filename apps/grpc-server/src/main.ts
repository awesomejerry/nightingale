import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { HelloRequest, HelloReply, GreeterServer } from '@nightingale/proto';
// import { PoemAgent, WelcomeAgent } from '@nightingale/langgraph';
import { MultiAgent, AgentEventCallback } from '@nightingale/langgraph';
import dotenv from 'dotenv';

// Define the HelloEventReply interface manually since there might be an issue with auto-generation
interface HelloEventReply {
  message: string;
  step: string;
}

dotenv.config();

const PROTO_PATH = path.join(process.cwd(), 'libs/proto/src/index.proto');
const pkgDef = protoLoader.loadSync(PROTO_PATH);
const grpcObj = grpc.loadPackageDefinition(pkgDef);
const GreeterService = (grpcObj.nightingale as any).Greeter;

// const welcomeAgent = new WelcomeAgent(process.env.OPENAI_API_KEY);
// const poemAgent = new PoemAgent(process.env.OPENAI_API_KEY);
const multiAgent = new MultiAgent(process.env.OPENAI_API_KEY);

const sayHello: GreeterServer['sayHello'] = async (
  call: grpc.ServerUnaryCall<HelloRequest, HelloReply>,
  callback: grpc.sendUnaryData<HelloReply>
) => {
  try {
    // const greeting = await welcomeAgent.greet(call.request.name);
    // const poem = await poemAgent.composePoem(greeting);
    // const response: HelloReply = { message: poem };
    const result = await multiAgent.run(call.request.name);
    const response: HelloReply = { message: result.poem };
    callback(null, response);
  } catch (err) {
    callback(
      {
        code: grpc.status.INTERNAL,
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      null
    );
  }
};

// Implementation of the streaming service
const sayHelloStream = (call: grpc.ServerWritableStream<HelloRequest, HelloEventReply>) => {
  try {
    const userInput = call.request.name;
    console.log(`Processing streaming request for: ${userInput}`);

    // Create a callback function to handle events
    const onEvent: AgentEventCallback = (step, message) => {
      console.log(`[${step}] ${message}`);
      
      // Send the event as a streaming response
      const response: HelloEventReply = { 
        message: message,
        step: step
      };
      
      call.write(response);
    };

    // Run the agent with event streaming
    multiAgent.runWithEvents(userInput, onEvent)
      .then((result) => {
        // Send a final message with the complete result
        const finalResponse: HelloEventReply = {
          message: result.poem || 'Processing complete',
          step: 'complete'
        };
        call.write(finalResponse);
        call.end(); // End the stream
      })
      .catch((err) => {
        console.error('Error in streaming service:', err);
        
        // Send error message if not already sent by event handler
        const errorResponse: HelloEventReply = {
          message: err instanceof Error ? err.message : 'Unknown error',
          step: 'error'
        };
        call.write(errorResponse);
        call.end();
      });
  } catch (err) {
    console.error('Error setting up streaming service:', err);
    // Send error response and end stream instead of using destroy
    const errorResponse: HelloEventReply = {
      message: err instanceof Error ? err.message : 'Unknown error',
      step: 'error'
    };
    call.write(errorResponse);
    call.end();
  }
};

const server = new grpc.Server();
server.addService(GreeterService.service, { 
  SayHello: sayHello,
  SayHelloStream: sayHelloStream
});
server.bindAsync(
  '0.0.0.0:50051',
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log('gRPC Server listening on :50051');
  }
);
