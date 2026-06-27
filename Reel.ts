import { Container } from "pixi.js";
import { gsap } from "gsap";
import { SlotSymbol } from "./SlotSymbol";
import { ALL_SYMBOLS, SymbolType } from "./SymbolType";
import { Config } from "./Config";
import { createReelFrame, createSymbolCell } from "./CasinoStyle";

export class Reel extends Container {
    private slotSymbols: SlotSymbol[] = [];
    private readonly topPadding = 135;

    constructor() {
        super();

        this.createBackground();
        this.createSymbols();
    }

    private createBackground() {
        const frame = createReelFrame(
            Config.reelWidth,
            Config.reelHeight
        );

        this.addChild(frame);
    }

    private createSymbols() {
        for (let i = 0; i < Config.reelSymbolCount; i++) {
            const y = this.topPadding + i * Config.symbolGap;

            const cell = createSymbolCell(Config.symbolCellSize);

            cell.x = Config.reelWidth / 2 - Config.symbolCellSize / 2;
            cell.y = y - Config.symbolCellSize / 2;

            this.addChild(cell);

            const symbol = new SlotSymbol(this.getRandomSymbol());

            symbol.x = Config.reelWidth / 2;
            symbol.y = y;

            this.slotSymbols.push(symbol);
            this.addChild(symbol);
        }
    }
    public getSymbolPosition(row: number) {
        return {
            x: this.x + Config.reelWidth / 2,
            y: this.y + this.topPadding + row * Config.symbolGap,
        };
    }
    public danceSymbol(row: number) {
        const symbol = this.slotSymbols[row];
        if (!symbol) return;

        gsap.killTweensOf(symbol);
        gsap.killTweensOf(symbol.scale);

        symbol.rotation = 0;
        symbol.scale.set(1);

        gsap.timeline({
            onComplete: () => {
                symbol.rotation = 0;
                symbol.scale.set(1);
            },
        })
            .to(symbol.scale, {
                x: 1.18,
                y: 1.18,
                duration: 0.15,
                ease: "back.out",
            })
            .to(symbol, {
                rotation: 0.12,
                duration: 0.08,
                yoyo: true,
                repeat: 3,
                ease: "sine.inOut",
            })
            .to(symbol.scale, {
                x: 1,
                y: 1,
                duration: 0.15,
            });
    }

    private getRandomSymbol(): SymbolType {
        return ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
    }

    spin(delay: number): Promise<void> {
        return new Promise((resolve) => {
            gsap.to(this, {
                y: this.y + 25,
                duration: 0.08,
                repeat: 15,
                yoyo: true,
                delay,
                ease: "power1.inOut",
                onRepeat: () => {
                    this.slotSymbols.forEach((symbol) => {
                        symbol.changeSymbol(this.getRandomSymbol());
                    });
                },
                onComplete: () => {
                    this.slotSymbols.forEach((symbol) => {
                        symbol.changeSymbol(this.getRandomSymbol());
                    });

                    resolve();
                },
            });
        });
    }

    getVisibleSymbols(): SymbolType[] {
        return this.slotSymbols.map((symbol) => symbol.symbolType);
    }
}