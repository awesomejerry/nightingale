import express from 'express';
import cors from 'cors';
import * as trpc from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { z } from 'zod';

const t = trpc.initTRPC.create();

const appRouter = t.router({
  hello: t.procedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      return { message: `Server says: ${input.name}` };
    }),
});

export type AppRouter = typeof appRouter;

const app = express();
app.use(cors({ origin: 'http://localhost:4200', credentials: true })); // Allow web-app dev server
app.use('/trpc', trpcExpress.createExpressMiddleware({ router: appRouter }));
app.listen(4000, () => console.log('tRPC Server @4000'));
