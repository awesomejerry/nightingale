import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { HelloRequest, HelloReply } from '@nightingale/proto';

const PROTO_PATH = path.join(process.cwd(), 'libs/proto/src/index.proto');

describe('gRPC Greeter Service', () => {
  let client: any;

  beforeAll(async () => {
    const packageDefinition = protoLoader.loadSync(PROTO_PATH);
    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    const GreeterService = (protoDescriptor.nightingale as any).Greeter;
    client = new GreeterService(
      'localhost:50051',
      grpc.credentials.createInsecure()
    );
  });

  afterAll(() => {
    if (client) {
      client.close();
    }
  });

  it('should return a greeting message', (done) => {
    const request: HelloRequest = { name: 'World' };
    
    client.sayHello(request, (error: any, response: HelloReply) => {
      try {
        expect(error).toBeNull();
        expect(response.message).toBe('World');
        done();
      } catch (e) {
        done(e);
      }
    });
  }, 10000);
});
