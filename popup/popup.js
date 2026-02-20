let highlighted = false;

browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  document.getElementById("page-title").textContent = tab.title || tab.url;
});

document.getElementById("highlight-btn").addEventListener("click", async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  highlighted = !highlighted;
  await browser.tabs.sendMessage(tab.id, { type: "toggleHighlight", active: highlighted });
  document.getElementById("highlight-btn").textContent = highlighted
    ? "Remove highlights"
    : "Highlight all links";
});
