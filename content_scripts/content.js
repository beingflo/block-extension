browser.runtime.onMessage.addListener((message) => {
  if (message.type === "toggleHighlight") {
    document.querySelectorAll("a").forEach((link) => {
      link.style.outline = message.active ? "2px solid orange" : "";
      link.style.backgroundColor = message.active ? "rgba(255, 165, 0, 0.15)" : "";
    });
  }
});
