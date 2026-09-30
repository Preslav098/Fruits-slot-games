import { Sprite, Texture } from "pixi.js";
import { Config } from "./Config";
import { SymbolImage, SymbolType } from "./SymbolType";

export class SlotSymbol extends Sprite {
    public symbolType: SymbolType;

    constructor(symbolType: SymbolType) {
        super(Texture.from(SymbolImage[symbolType]));

        this.symbolType = symbolType;

        this.anchor.set(0.5);
        this.width = Config.symbolSize;
        this.height = Config.symbolSize;
    }

    changeSymbol(symbolType: SymbolType) {
        this.symbolType = symbolType;
        this.texture = Texture.from(SymbolImage[symbolType]);
    }
}