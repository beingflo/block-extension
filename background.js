const DEFAULT_SECONDS = 3600; // initial grant on first install

function todayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function ensureCounter() {
  const data = await browser.storage.local.get(["counter", "lastRefillDate"]);
  const updates = {};
  if (data.counter === undefined) {
    updates.counter = DEFAULT_SECONDS;
  }
  if (data.lastRefillDate === undefined) {
    updates.lastRefillDate = todayDateString();
  }
  if (Object.keys(updates).length > 0) {
    await browser.storage.local.set(updates);
  }
}

browser.runtime.onInstalled.addListener(async () => {
  await ensureCounter();
});
