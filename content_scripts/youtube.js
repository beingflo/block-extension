(() => {
  // Hide page immediately to prevent flash of content when blocking
  document.documentElement.style.visibility = "hidden";

  const BLOCKED_URL = browser.runtime.getURL("pages/blocked.html");
  const DAILY_REFILL_SECONDS = 2700; // 45 minutes per day
  const MAX_SECONDS = 14400; // 4 hour cap

  function redirect() {
    window.location.replace(BLOCKED_URL);
  }

  function formatTime(seconds) {
    const s = Math.max(0, seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  let remaining = 0;
  let intervalId = null;
  let hud = null;

  function createHud() {
    const existing = document.getElementById("__yt_time_hud__");
    if (existing) existing.remove();
    hud = document.createElement("div");
    hud.id = "__yt_time_hud__";
    Object.assign(hud.style, {
      position: "fixed",
      bottom: "8px",
      right: "8px",
      zIndex: "2147483647",
      background: "rgba(0,0,0,0.75)",
      color: "#fff",
      fontFamily: "monospace",
      fontSize: "12px",
      padding: "2px 4px",
      borderRadius: "6px",
      pointerEvents: "none",
      userSelect: "none",
    });
    document.body.appendChild(hud);
    updateHud();
  }

  function updateHud() {
    if (hud) hud.textContent = `${formatTime(remaining)}`;
  }

  function startInterval() {
    if (intervalId !== null) return;
    intervalId = setInterval(async () => {
      remaining -= 1;
      updateHud();
      await browser.storage.local.set({ counter: remaining });
      if (remaining <= 0) {
        stopInterval();
      }
    }, 1000);
  }

  function stopInterval() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function todayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  async function refillIfDue() {
    const data = await browser.storage.local.get(["counter", "lastRefillDate"]);
    const today = todayDateString();
    const lastDate = data.lastRefillDate ?? today;
    const daysPassed = Math.max(0, Math.floor((new Date(today) - new Date(lastDate)) / (86400 * 1000)));
    if (daysPassed < 1) return;
    const current = data.counter ?? 0;
    await browser.storage.local.set({
      counter: Math.min(current + daysPassed * DAILY_REFILL_SECONDS, MAX_SECONDS),
      lastRefillDate: today,
    });
  }

  async function resyncFromStorage() {
    await refillIfDue();
    const data = await browser.storage.local.get("counter");
    remaining = data.counter ?? 0;
    updateHud();
    if (remaining <= 0) {
      stopInterval();
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopInterval();
    } else {
      resyncFromStorage().then(() => {
        if (remaining > 0) startInterval();
      });
    }
  });

  window.addEventListener("blur", () => stopInterval());
  window.addEventListener("focus", () => {
    resyncFromStorage().then(() => {
      if (remaining > 0) startInterval();
    });
  });

  // Only update remaining from storage when the new value is higher
  // (popup additions or daily refills), to avoid fighting tick writes.
  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.counter) return;
    const newVal = changes.counter.newValue ?? 0;
    if (newVal > remaining) {
      remaining = newVal;
      updateHud();
    }
  });

  async function init() {
    await refillIfDue();
    const data = await browser.storage.local.get("counter");
    remaining = data.counter ?? 0;

    if (remaining <= 0) {
      redirect();
      return;
    }

    document.documentElement.style.visibility = "";

    // Wait for body before inserting HUD
    if (document.body) {
      createHud();
    } else {
      document.addEventListener("DOMContentLoaded", createHud, { once: true });
    }

    if (!document.hidden) startInterval();
  }

  document.addEventListener("yt-navigate-finish", () => {
    if (remaining <= 0) {
      redirect();
    }
  });

  init();
})();
