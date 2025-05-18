import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { HelloRequest, HelloReply, GreeterServer } from '@nightingale/proto';

const PROTO_PATH = path.join(process.cwd(), 'libs/proto/src/index.proto');
const pkgDef = protoLoader.loadSync(PROTO_PATH);
const grpcObj = grpc.loadPackageDefinition(pkgDef);
const GreeterService = (grpcObj.nightingale as any).Greeter;

const sayHello: GreeterServer['sayHello'] = (
  call: grpc.ServerUnaryCall<HelloRequest, HelloReply>,
  callback: grpc.sendUnaryData<HelloReply>
) => {
  try {
    const response: HelloReply = { message: `Hello ${call.request.name}` };
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
