import "./styles.css";
import { MiniFantasyGame } from "./game/Game";

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("Missing #app root element");
}

const game = new MiniFantasyGame(app);

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.destroy());
}
