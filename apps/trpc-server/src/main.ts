import express from 'express';
import cors from 'cors';
import * as trpc from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { z } from 'zod';
import * as grpc from '@grpc/grpc-js';
import { GreeterClient } from '@nightingale/proto';


const t = trpc.initTRPC.create({
  sse: {
    ping: {
      enabled: true,
      intervalMs: 1000,
    },
    client: {
      reconnectAfterInactivityMs: 3000,
    },
  },
});

const appRouter = t.router({
  hello: t.procedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      // Create gRPC client
      const client = new GreeterClient(
        'localhost:50051',
        grpc.credentials.createInsecure()
      );
      // Wrap gRPC call in a Promise
      const response = await new Promise<{ message: string }>(
        (resolve, reject) => {
          client.sayHello({ name: input.name }, (err, res) => {
            if (err) return reject(err);
            resolve(res);
          });
        }
      );
      return {
        message: `gRPC Server says: ${response.message}`,
      };
    }),

  helloStream: t.procedure
    .input(z.object({ name: z.string() }))
    .subscription(async function* ({ input, signal }) {
      // Create gRPC client
      const client = new GreeterClient(
        'localhost:50051',
        grpc.credentials.createInsecure()
      );

      // Call the streaming gRPC method
      const stream = client.sayHelloStream({ name: input.name });

      try {
        // Set up promise-based data handling
        const streamData: Array<{ message: string; step: string }> = [];
        let streamEnded = false;
        let streamError: Error | null = null;
        let resolveNext: (() => void) | null = null;

        // Handle stream events
        stream.on('data', (data) => {
          streamData.push({
            message: data.message,
            step: data.step,
          });
          if (resolveNext) {
            resolveNext();
            resolveNext = null;
          }
        });

        stream.on('end', () => {
          streamEnded = true;
          if (resolveNext) {
            resolveNext();
            resolveNext = null;
          }
        });

        stream.on('error', (error) => {
          streamError = error;
          if (resolveNext) {
            resolveNext();
            resolveNext = null;
          }
        });

        // Handle abort signal
        if (signal) {
          signal.addEventListener('abort', () => {
            stream.cancel();
            streamEnded = true;
            if (resolveNext) {
              resolveNext();
              resolveNext = null;
            }
          });
        }

        // Yield data as it arrives
        while (!streamEnded || streamData.length > 0) {
          if (streamData.length > 0) {
            const data = streamData.shift();
            if (data) {
              yield data;
            }
          } else if (streamError) {
            throw streamError;
          } else if (!streamEnded) {
            // Wait for more data
            await new Promise<void>((resolve) => {
              resolveNext = resolve;
            });
          }
        }

        if (streamError) {
          throw streamError;
        }
      } finally {
        // Cleanup: cancel the stream when subscription ends
        stream.cancel();
      }
    }),

  supervisor: t.procedure
    .input(z.object({
      task: z.string(),
      context: z.string().optional().default('')
    }))
    .mutation(async ({ input }) => {
      // Create gRPC client
      const client = new GreeterClient(
        'localhost:50051',
        grpc.credentials.createInsecure()
      );
      // Wrap gRPC call in a Promise
      const response = await new Promise<{ result: string; status: string }>(
        (resolve, reject) => {
          client.runSupervisor({
            task: input.task,
            context: input.context
          }, (err, res) => {
            if (err) return reject(err);
            resolve(res);
          });
        }
      );
      return {
        result: response.result,
        status: response.status,
      };
    }),
});

export type AppRouter = typeof appRouter;

const app = express();
app.use(cors({ origin: 'http://localhost:4200', credentials: true })); // Allow web-app dev server
app.use('/trpc', trpcExpress.createExpressMiddleware({ router: appRouter }));
app.listen(4000, () => console.log('tRPC Server @4000'));
