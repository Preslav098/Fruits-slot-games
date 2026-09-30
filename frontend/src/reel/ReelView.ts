import { BlurFilter, Container, Graphics } from "pixi.js";
import { gsap } from "gsap";
import { SlotSymbol } from "./SlotSymbol";
import {
    ALL_SYMBOLS,
    type SymbolType,
} from "../interfaces/SymbolType";
import { Config } from "../config/Config";

export class ReelView extends Container {
    private band = new Container();
    private symbols: SlotSymbol[] = [];
    private blur = new BlurFilter({
        strength: 0,
        quality: 4,
    });

    private readonly topPadding =
        70 + Config.symbolGap / 2;
    constructor() {
        super();
        const mask = new Graphics()
            .rect(
                0,
                70,
                Config.reelWidth,
                Config.symbolGap * Config.visibleRows,
            )
            .fill(0xffffff);
        this.addChild(this.band, mask);

        this.band.mask = mask;
        this.band.filters = [this.blur];

        for (let i = 0; i < Config.visibleRows + 2; i++) {
            const symbol = new SlotSymbol(
                ALL_SYMBOLS[i % ALL_SYMBOLS.length],
            );

            this.symbols.push(symbol);
            this.band.addChild(symbol);
        }
    }

    protected renderStrip(
        strip: readonly SymbolType[],
        position: number,
        blurStrength: number,
    ) {
        const base = Math.floor(position);
        const fraction = position - base;

        this.symbols.forEach((symbol, index) => {
            const offset = index - 1;

            const stripIndex =
                ((base + offset) % strip.length + strip.length) %
                strip.length;

            const symbolType = strip[stripIndex];

            if (symbol.symbolType !== symbolType) {
                symbol.changeSymbol(symbolType);
            }

            symbol.x = Config.reelWidth / 2;
            symbol.y =
                this.topPadding +
                (offset - fraction) * Config.symbolGap;
        });

        this.blur.strengthX = 0;
        this.blur.strengthY = blurStrength;
    }

    protected clearBlur() {
        this.blur.strengthY = 0;
    }

    getSymbolPosition(row: number) {
        return {
            x: this.x + Config.reelWidth / 2,
            y: this.y + this.topPadding + row * Config.symbolGap,
        };
    }

    resetEffects() {
        this.symbols.forEach((symbol) => {
            gsap.killTweensOf(symbol);
            gsap.killTweensOf(symbol.scale);

            symbol.rotation = 0;
            symbol.width = Config.symbolSize;
            symbol.height = Config.symbolSize;
        });
    }

    danceSymbol(row: number) {
        const symbol = this.symbols[row + 1];
        if (!symbol) return;

        const scaleX = symbol.scale.x;
        const scaleY = symbol.scale.y;

        gsap.to(symbol.scale, {
            x: scaleX * 1.12,
            y: scaleY * 1.12,
            duration: 0.2,
            repeat: 3,
            yoyo: true,
        });
    }

    override destroy() {
        this.resetEffects();
        super.destroy({ children: true });
    }
}