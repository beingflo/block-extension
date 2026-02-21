const ALARM_NAME = "hourlyRefill";
const REFILL_SECONDS = 150; // 2.5 minutes per hour
const DEFAULT_SECONDS = 3600; // initial grant on first install
const MAX_SECONDS = 36000; // 10 hour cap
const HOUR_MS = 3600 * 1000;

function currentHourTimestamp() {
  return Math.floor(Date.now() / HOUR_MS) * HOUR_MS;
}

async function ensureAlarm() {
  await browser.alarms.clear(ALARM_NAME);
  browser.alarms.create(ALARM_NAME, {
    delayInMinutes: 5,
    periodInMinutes: 5,
  });
}

async function ensureCounter() {
  const data = await browser.storage.local.get(["counter", "lastRefillTime"]);
  const updates = {};
  if (data.counter === undefined) {
    updates.counter = DEFAULT_SECONDS;
  }
  if (data.lastRefillTime === undefined) {
    updates.lastRefillTime = currentHourTimestamp();
  }
  if (Object.keys(updates).length > 0) {
    await browser.storage.local.set(updates);
  }
}

async function refillIfDue() {
  const data = await browser.storage.local.get(["counter", "lastRefillTime"]);
  const lastRefillTime = data.lastRefillTime ?? currentHourTimestamp();
  const hoursElapsed = Math.floor((Date.now() - lastRefillTime) / HOUR_MS);
  if (hoursElapsed < 1) return;
  const current = data.counter ?? 0;
  await browser.storage.local.set({
    counter: Math.min(current + hoursElapsed * REFILL_SECONDS, MAX_SECONDS),
    lastRefillTime: currentHourTimestamp(),
  });
}

browser.runtime.onInstalled.addListener(async () => {
  await ensureCounter();
  await ensureAlarm();
});

browser.runtime.onStartup.addListener(async () => {
  await refillIfDue();
  await ensureAlarm();
});

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  await refillIfDue();
});
