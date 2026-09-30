import "./style.css";
import { Application } from "pixi.js";
import { Game } from "./Game.ts";
import { AssetLoader } from "./AssetLoader.ts";

const app = new Application();


await app.init({
  resizeTo: window,
  background: "#2d1b45",
});

document.getElementById("app")!.appendChild(app.canvas);

await AssetLoader.load();

const game = new Game(app);
game.start();