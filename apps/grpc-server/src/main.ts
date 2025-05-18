import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { HelloRequest, HelloReply, GreeterServer } from '@nightingale/proto';
// import { PoemAgent, WelcomeAgent } from '@nightingale/langgraph';
import { MultiAgent } from '@nightingale/langgraph';
import dotenv from 'dotenv';

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

const server = new grpc.Server();
server.addService(GreeterService.service, { SayHello: sayHello });
server.bindAsync(
  '0.0.0.0:50051',
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log('gRPC Server listening on :50051');
  }
);
