const DEFAULT_SECONDS = 3600; // initial grant on first install

async function ensureCounter() {
  const data = await browser.storage.local.get(["counter", "lastRefillTime"]);
  const updates = {};
  if (data.counter === undefined) {
    updates.counter = DEFAULT_SECONDS;
  }
  if (data.lastRefillTime === undefined) {
    updates.lastRefillTime = Date.now();
  }
  if (Object.keys(updates).length > 0) {
    await browser.storage.local.set(updates);
  }
}

browser.runtime.onInstalled.addListener(async () => {
  await ensureCounter();
});
