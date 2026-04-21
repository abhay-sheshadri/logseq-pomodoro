import "@logseq/libs";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

function main() {
  const root = ReactDOM.createRoot(document.getElementById("root")!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  logseq.provideStyle(`
    .logseq-pomodoro-btn {
      display: flex;
      align-items: center;
      padding: 4px 6px;
      opacity: 0.6;
    }
    .logseq-pomodoro-btn:hover {
      opacity: 0.9;
    }
  `);

  logseq.App.registerUIItem("toolbar", {
    key: "pomodoro-timer",
    template: `
      <a class="logseq-pomodoro-btn" data-on-click="showPomodoro" title="Pomodoro Timer">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="13" r="9"/>
          <polyline points="12 9 12 13 15 16"/>
          <path d="M9 2h6"/>
          <path d="M12 2v2"/>
        </svg>
      </a>
    `,
  });

  logseq.provideModel({
    showPomodoro() {
      logseq.showMainUI({ autoFocus: true });
    },
  });

  logseq.App.registerCommandPalette(
    {
      key: "open-pomodoro",
      label: "Open Pomodoro Timer",
      keybinding: { binding: "mod+shift+p" },
    },
    () => {
      logseq.showMainUI({ autoFocus: true });
    }
  );
}

logseq.ready(main).catch(console.error);
