import "./style.css";
import { Application } from "pixi.js";
import { Game } from "./Game";
const app = new Application();
await app.init({ resizeTo: window, background: '#170e26', antialias: true });
document.getElementById('app')!.appendChild(app.canvas);
const game = new Game(app);
await game.init();
if (import.meta.hot) import.meta.hot.dispose(() => { game.destroy(); app.destroy(true, { children: true }); });
