const ALARM_NAME = "hourlyRefill";
const REFILL_SECONDS = 150; // 2.5 minutes per hour
const DEFAULT_SECONDS = 3600; // initial grant on first install

function nextHourTimestamp() {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next.getTime();
}

async function ensureAlarm() {
  const existing = await browser.alarms.get(ALARM_NAME);
  if (!existing) {
    browser.alarms.create(ALARM_NAME, {
      when: nextHourTimestamp(),
      periodInMinutes: 1,
    });
  }
}

async function ensureCounter() {
  const data = await browser.storage.local.get("counter");
  if (data.counter === undefined) {
    await browser.storage.local.set({ counter: DEFAULT_SECONDS });
  }
}

browser.runtime.onInstalled.addListener(async () => {
  await ensureCounter();
  await ensureAlarm();
});

browser.runtime.onStartup.addListener(async () => {
  await ensureAlarm();
});

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  const data = await browser.storage.local.get("counter");
  const current = data.counter ?? 0;
  await browser.storage.local.set({ counter: current + REFILL_SECONDS });
});
