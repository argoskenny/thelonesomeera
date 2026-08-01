import "./style.css";
import { KartGame } from "./game/KartGame";

document.documentElement.style.setProperty(
  "--sky-image",
  `url("${import.meta.env.BASE_URL}assets/sky-islands.png")`,
);

const container = document.getElementById("scene");
if (!container) throw new Error("Missing #scene mount point");

new KartGame(container);
