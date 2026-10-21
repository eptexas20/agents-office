import { getProvider } from "../src/providers/index.js";
import { ProviderStop } from "../src/providers/grok-bot.js";

const MESSAGE = "Reply with exactly: OFFICE_TEST_OK";
// Set GROK_BOT_NAME to pick one of your bots; otherwise the first bot is used.
const PREFERRED_BOT = process.env.GROK_BOT_NAME;
const provider = getProvider("grok-bot");

const result = {
  bot: "(none)",
  sent: MESSAGE,
  received: "(none)",
  passed: false,
};

try {
  const listed = await provider.listBots();
  const bots = listed.bots ?? [];
  const selected = bots.find((bot) => bot.name === PREFERRED_BOT) ?? bots[0];
  if (!selected) {
    console.error("No existing Grok Bots were found. This test will not create one.");
    process.exitCode = 1;
  } else {
    result.bot = selected.name;
    const sent = await provider.sendMessage({ botId: selected.id, text: MESSAGE });
    result.received = sent.reply ?? "(none)";
    result.passed = result.received.includes("OFFICE_TEST_OK");
    process.exitCode = result.passed ? 0 : 1;
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  if (error instanceof ProviderStop && error.logs?.length) {
    for (const line of error.logs) console.error(line);
  }
  process.exitCode = 1;
} finally {
  printResult(result);
  await provider.close();
}

function printResult(summary) {
  console.log("");
  console.log(`selected bot: ${summary.bot}`);
  console.log(`sent message: ${summary.sent}`);
  console.log(`received response: ${summary.received}`);
  console.log(`passed: ${summary.passed ? "yes" : "no"}`);
}
