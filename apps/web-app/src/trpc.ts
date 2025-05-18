import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@nightingale/trpc-server/src/main';

export const trpc = createTRPCReact<AppRouter>();
