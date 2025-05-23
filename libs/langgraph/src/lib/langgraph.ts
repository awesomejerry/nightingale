export function langgraph(): string {
  return 'langgraph';
}

export { WelcomeAgent } from './agents/welcome.js';
export { PoemAgent } from './agents/poem.js';
export { MultiAgent } from './agents/multiagent.js';
export type { AgentEventCallback } from './agents/multiagent.js';
