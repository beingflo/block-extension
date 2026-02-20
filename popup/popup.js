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

async function refreshDisplay() {
  const data = await browser.storage.local.get("counter");
  const counter = data.counter ?? 0;
  document.getElementById("time").textContent = formatTime(counter);
  document.getElementById("add").disabled = counter > 0;
}

document.getElementById("add").addEventListener("click", async () => {
  const data = await browser.storage.local.get("counter");
  const current = data.counter ?? 0;
  await browser.storage.local.set({ counter: current + 300 });
  refreshDisplay();
});

refreshDisplay();
setInterval(refreshDisplay, 1000);
