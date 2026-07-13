import "./styles.css";
import { RoomApp } from "./app/RoomApp";

const container = document.querySelector<HTMLElement>("#app");

if (!container) {
  throw new Error("App container #app was not found.");
}

const app = new RoomApp(container);

app.init().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown initialization error";
  const loading = document.querySelector<HTMLElement>("#loading");
  if (loading) {
    loading.classList.add("loading-screen--error");
    loading.innerHTML = `<strong>場景啟動失敗</strong><span>${message}</span>`;
  }
  console.error(error);
});
