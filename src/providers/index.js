import { GrokBotProvider } from "./grok-bot.js";

const providers = new Map([["grok-bot", new GrokBotProvider()]]);

export function listProviders() {
  return [...providers.values()].map((provider) => ({
    id: provider.id,
    label: provider.label,
  }));
}

export function getProvider(id = "grok-bot") {
  const provider = providers.get(id);
  if (!provider) {
    throw new Error(`Unknown provider: ${id}`);
  }
  return provider;
}
