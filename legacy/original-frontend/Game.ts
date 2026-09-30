import { Application, Sprite, Texture, Text, TextStyle, Point } from "pixi.js"; import { Reel } from "./Reel";
import { UI } from "./UI";
import { Config } from "./Config";
import { WinChecker } from "./WinChecker";
import type { WinningLine } from "./interfaces/WinningLine";
import { PAYLINES } from "./Payline";
import { LineRenderer } from "./LineRenderer.ts";
import { gsap } from "gsap";



export class Game {
    private app: Application;
    private background!: Sprite;
    private logo!: Sprite;
    private reels: Reel[] = [];
    private ui!: UI;
    private lineRenderer!: LineRenderer;
    private reelWidth!: number;
    private reelHeight!: number;
    private reelsTotalWidth = 0;
    private symbolCellSize!: number;

    private reelsStartX = 0;
    private reelsWidth = 0;
    private reelGap = 0;

    private spinning = false;
    private credits = Config.startCredits;
    private bet = Config.defaultBet;
    private win = 0;
    private winningLines: WinningLine[] = [];

    constructor(app: Application) {
        this.app = app;
    }

    private resizeScene = () => {
        if (this.background) {
            this.background.width = this.app.screen.width;
            this.background.height = this.app.screen.height;
        }

        if (this.logo) {
            const logoWidth = Math.min(this.app.screen.width * 0.46, 720);
            this.logo.width = logoWidth;
            this.logo.height = logoWidth * 0.166;
            this.logo.x = this.app.screen.width / 2;
            this.logo.y = 18;
        }
    };


    start() {
        this.createBackground();
        this.createLogo();
        window.addEventListener("resize", this.resizeScene);
        this.calculateLayout();
        this.createReels();
        this.lineRenderer = new LineRenderer();
        this.app.stage.addChild(this.lineRenderer);

        this.ui = new UI(
            this.app,
            () => this.spin(),
            () => this.increaseBet(),
            () => this.decreaseBet(),

        );

        this.updateUI();
    }

    private createBackground() {
        this.background = new Sprite(Texture.from("/assets/ui-kit/casino-background.svg"));
        this.background.x = 0;
        this.background.y = 0;
        this.resizeScene();
        this.app.stage.addChild(this.background);
    }

    private createLogo() {
        this.logo = new Sprite(Texture.from("/assets/ui-kit/fruits-logo.svg"));
        this.logo.anchor.set(0.5, 0);
        this.resizeScene();
        this.app.stage.addChild(this.logo);
    }

    private calculateLayout() {
        const bottomPanelHeight = 150;

        this.reelHeight = this.app.screen.height - bottomPanelHeight - 20;

        this.reelWidth = this.reelHeight * 0.33;

        this.symbolCellSize = this.reelWidth * 0.82;
    }

    private createReels() {
        const sidePadding = 600;

        const availableWidth = this.app.screen.width - sidePadding * 2;

        const totalReelWidth = Config.reelCount * Config.reelWidth;

        this.reelGap =
            (availableWidth - totalReelWidth) / (Config.reelCount - 1);

        this.reelsStartX = sidePadding;

        this.reelsWidth =
            totalReelWidth + this.reelGap * (Config.reelCount - 1);

        for (let i = 0; i < Config.reelCount; i++) {
            const reel = new Reel();

            reel.x = this.reelsStartX + i * (Config.reelWidth + this.reelGap);

            const panelHeight = 150;
            const titleHeight = 220;

            const availableHeight =
                this.app.screen.height - panelHeight - titleHeight;

            reel.y =
                titleHeight + (availableHeight - Config.reelHeight) / 2;

            this.reels.push(reel);
            this.app.stage.addChild(reel);
        }
    }
    private animateWinningSymbols(winningLines: WinningLine[]) {
        const animated = new Set<string>();

        for (const winLine of winningLines) {
            const payline = PAYLINES[winLine.paylineIndex];

            for (let reelIndex = 0; reelIndex < winLine.count; reelIndex++) {
                const rowIndex = payline[reelIndex];
                const key = `${reelIndex}-${rowIndex}`;

                if (animated.has(key)) continue;

                animated.add(key);
                this.reels[reelIndex].danceSymbol(rowIndex);
            }
        }
    }

    private showCongratulations() {
        const banner = new Sprite(Texture.from("/assets/selebration/big-win-fixed.svg"));

        banner.anchor.set(0.5);
        banner.x = this.app.screen.width / 2;
        banner.y = this.app.screen.height / 2 - 40;

        banner.alpha = 0;
        banner.scale.set(0.2);

        this.app.stage.addChild(banner);

        gsap.timeline({
            onComplete: () => {
                banner.destroy();
            },
        })
            .to(banner, {
                alpha: 1,
                duration: 0.15,
            })
            .to(
                banner.scale,
                {
                    x: 1,
                    y: 1,
                    duration: 0.35,
                    ease: "back.out(2)",
                },
                0
            )
            .to(banner.scale, {
                x: 1.08,
                y: 1.08,
                duration: 0.4,
                repeat: 2,
                yoyo: true,
                ease: "sine.inOut",
            })
            .to(banner, {
                alpha: 0,
                duration: 0.25,
            });
    }


    private async spin() {
        if (this.spinning) return;
        if (this.credits < this.bet) return;

        this.spinning = true;
        this.ui.setSpinEnabled(false);
        this.lineRenderer.clearLine();

        this.credits -= this.bet;
        this.win = 0;
        this.updateUI();

        await Promise.all(
            this.reels.map((reel, index) => reel.spin(index * 0.15))
        );

        const grid = this.getResultGrid();
        console.log(grid);

        const winResult = WinChecker.calculateWin(grid, this.bet);
        if (winResult.winningLines.length > 0) {
            const firstWin = winResult.winningLines[0];
            const payline = PAYLINES[firstWin.paylineIndex];

            const points = payline.map((rowIndex, reelIndex) => {
                const pos = this.reels[reelIndex].getSymbolPosition(rowIndex);

                return new Point(pos.x, pos.y);
            });

            this.lineRenderer.draw(points);
        }
        this.win = winResult.totalWin;
        this.winningLines = winResult.winningLines;
        this.credits += this.win;

        this.animateWinningSymbols(winResult.winningLines);

        if (this.win > 100) {
            this.showCongratulations();
        }
        this.updateUI();

        this.spinning = false;
        this.ui.setSpinEnabled(true);
    }

    private getResultGrid() {
        return this.reels.map((reel) => reel.getVisibleSymbols());
    }


    private updateUI() {
        this.ui.updateCredits(this.credits);
        this.ui.updateBet(this.bet);
        this.ui.updateWin(this.win);
    }
    private increaseBet() {
        if (this.spinning) return;

        this.bet += 10;
        this.updateUI();
    }

    private decreaseBet() {
        if (this.spinning) return;

        if (this.bet > 10) {
            this.bet -= 10;
            this.updateUI();
        }
    }
}