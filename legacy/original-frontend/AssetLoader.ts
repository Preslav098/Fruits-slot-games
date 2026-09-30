import { Assets } from "pixi.js";
import { SymbolImage } from "./SymbolType";

export class AssetLoader {
    static async load() {
        await Assets.load([
            ...Object.values(SymbolImage),
            "/assets/ui-kit/reel-frame.svg",
            "/assets/ui-kit/casino-background.svg",
            "/assets/ui-kit/fruits-logo.svg",
            "/assets/selebration/big-win-fixed.svg",
        ]);
    }
}