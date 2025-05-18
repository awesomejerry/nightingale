import express from 'express';
import cors from 'cors';
import * as trpc from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { z } from 'zod';
import * as grpc from '@grpc/grpc-js';
import { GreeterClient } from '@nightingale/proto';

const t = trpc.initTRPC.create();

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
});

export type AppRouter = typeof appRouter;

const app = express();
app.use(cors({ origin: 'http://localhost:4200', credentials: true })); // Allow web-app dev server
app.use('/trpc', trpcExpress.createExpressMiddleware({ router: appRouter }));
app.listen(4000, () => console.log('tRPC Server @4000'));
