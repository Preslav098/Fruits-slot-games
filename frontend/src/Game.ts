import { Application, Sprite, Texture, Point, Text, TextStyle, Graphics, Container } from "pixi.js";
import { gsap } from "gsap";
import { Reel } from "./reel/Reel";
import { UI } from "./ui/UI";
import { Config } from "./config/Config";
import { AssetLoader } from "./AssetLoader";
import { SlotApi, ApiError } from "./api/SlotApi";
import { LineRenderer } from "./effects/LineRenderer";
import rules from "../../shared/game-config.json";
import type { SpinResult } from "../../shared/contracts";
import { RulesPanel } from "./ui/RulesPanel";
import { HistoryPanel } from "./ui/HistoryPanel";
// import { createReelFrame } from "./CasinoStyle";
import { SpinConfig } from "./config/SpingConfig";
type Phase = 'loading' | 'idle' | 'requesting' | 'spinning' | 'presenting' | 'destroyed';
export class Game {
  private reels: Reel[] = [];
  private historyPanel?: HistoryPanel;
  private api = new SlotApi();
  private ui!: UI;
  private rulesPanel?: RulesPanel;
  private lines = new LineRenderer();
  private message = new Text({ text: 'Connecting…', style: new TextStyle({ fill: 'white', fontSize: 24 }) });
  private phase: Phase = 'loading';
  private credits = 0;
  private bet = Config.defaultBet;
  private win = 0;
  private banner?: Sprite;
  private lineTimer?: number;
  private pending?: { bet: number; requestId: string };
  private board = new Container();
  private background!: Sprite;
  private logo!: Sprite;

  private readonly boardWidth =
    Config.reelCount * Config.reelWidth + 140;

  private readonly boardHeight = Config.reelHeight;
  constructor(private app: Application) { }
  async init() {
    await AssetLoader.load();

    this.background = new Sprite(
      Texture.from("/assets/ui-kit/casino-background.svg"),
    );

    this.app.stage.addChild(this.background);

    this.logo = new Sprite(
      Texture.from("/assets/ui-kit/fruits-logo.svg"),
    );

    this.logo.anchor.set(0.5, 0);
    this.app.stage.addChild(this.logo);

    this.app.stage.addChild(this.board);

    const frame = new Sprite(
      Texture.from("/assets/ui-kit/reel-frame.svg"),
    );

    frame.position.set(0, 0);
    frame.width = this.boardWidth;
    frame.height = this.boardHeight;

    for (let i = 0; i < Config.reelCount; i++) {
      const reel = new Reel({ ...SpinConfig });

      reel.position.set(
        70 + i * Config.reelWidth,
        0,
      );

      this.reels.push(reel);
      this.board.addChild(reel);
    }

    const dividers = new Graphics();

    const innerTop = 70;
    const innerHeight =
      Config.symbolGap * Config.visibleRows;

    for (let i = 1; i < Config.reelCount; i++) {
      const x = 70 + i * Config.reelWidth;

      dividers
        .rect(x - 4, innerTop, 8, innerHeight)
        .fill({
          color: 0x39200d,
          alpha: 0.9,
        });

      dividers
        .rect(x - 2, innerTop, 4, innerHeight)
        .fill(0xc9a020);

      dividers
        .rect(x - 1, innerTop, 1, innerHeight)
        .fill(0xfff4b5);
    }

    this.board.addChild(dividers);
    this.board.addChild(frame);
    this.board.addChild(this.lines);

    this.ui = new UI(
      this.app,
      () => {
        void this.spin();
      },
      () => this.changeBet(10),
      () => this.changeBet(-10),
    );
    this.rulesPanel = new RulesPanel();
    this.rulesPanel.setEnabled(false);
    this.historyPanel = new HistoryPanel();
    this.historyPanel.setEnabled(false);

    this.message.anchor.set(0.5);
    this.app.stage.addChild(this.message);

    this.resize();

    this.app.renderer.on("resize", this.resize);
    window.addEventListener("keydown", this.keydown);

    this.ui.setBusy(true);

    try {
      const session = await this.api.session();

      this.credits = session.credits;

      const lastSpin = session.lastSpin;

      if (lastSpin) {
        this.win = lastSpin.totalWin;

        this.reels.forEach((reel, index) => {
          reel.setResult(lastSpin.grid[index]);
        });
      }

      this.api.connect((event) => {
        if (this.phase !== "idle") return;

        if (event.type === "session") {
          this.credits = event.session.credits;
          this.updateUI();
        }

        if (event.type === "spin:result") {
          this.clearEffects();

          this.credits = event.result.credits;
          this.win = event.result.totalWin;

          this.reels.forEach((reel, index) => {
            reel.setResult(event.result.grid[index]);
          });

          this.updateUI();
        }
      });

      this.phase = "idle";
      this.rulesPanel.setEnabled(true);
      this.historyPanel?.setEnabled(true);
      this.message.text = "Ready • SPIN or Space";

      this.ui.setBusy(false);
      this.updateUI();
    } catch {
      this.message.text =
        "Start the API server and reload the page.";
    }
  }
  private resize = () => {
    if (!this.ui) return;

    const width = this.app.screen.width;
    const height = this.app.screen.height;

    const portrait = width < height && width < 700;
    const shortLandscape = !portrait && height < 500;

    const margin = width < 700 ? 8 : 16;

    this.app.stage.scale.set(1);
    this.app.stage.position.set(0, 0);

    const backgroundScale = Math.max(
      width / this.background.texture.width,
      height / this.background.texture.height,
    );

    this.background.scale.set(backgroundScale);

    this.background.position.set(
      (width - this.background.width) / 2,
      (height - this.background.height) / 2,
    );

    const logoWidth = Math.min(
      width * (portrait ? 0.7 : 0.4),
      shortLandscape ? 200 : 480,
    );

    this.logo.width = logoWidth;
    this.logo.height = logoWidth / 6;
    this.logo.position.set(width / 2, 8);

    const uiHeight = UI.heightFor(portrait);
    const uiWidth = Math.min(
      1220,
      width - margin * 2,
    );

    this.ui.resize(uiWidth, portrait);

    this.ui.position.set(
      (width - uiWidth) / 2,
      height - uiHeight - margin,
    );

    const top =
      this.logo.y + this.logo.height + 12;

    const messageSpace = 30;

    const availableHeight = Math.max(
      1,
      this.ui.y - top - messageSpace - 8,
    );

    const boardScale = Math.min(
      (width - margin * 2) / this.boardWidth,
      availableHeight / this.boardHeight,
    );

    this.board.scale.set(boardScale);

    const boardHeight =
      this.boardHeight * boardScale;

    this.board.position.set(
      (width - this.boardWidth * boardScale) / 2,
      top + (availableHeight - boardHeight) / 2,
    );

    this.message.style.fontSize =
      portrait ? 13 : 16;

    this.message.style.wordWrap = true;
    this.message.style.wordWrapWidth =
      width - margin * 2;

    this.message.position.set(
      width / 2,
      this.ui.y - messageSpace / 2,
    );

    this.resizeBanner();
  };
  private resizeBanner() {
    if (!this.banner) return;

    const width = Math.min(
      700,
      this.app.screen.width * 0.8,
      this.boardWidth * this.board.scale.x * 0.75,
    );

    this.banner.width = width;
    this.banner.height = width * (230 / 700);

    this.banner.position.set(
      this.app.screen.width / 2,
      this.board.y +
      this.boardHeight * this.board.scale.y / 2,
    );
  }
  private keydown = (event: KeyboardEvent) => {
    if (document.querySelector("dialog[open]")) return;
    if (document.querySelector("dialog[open]")) return;
    if (event.code === 'Space' && !event.repeat) {
      event.preventDefault();
      void this.spin();
    }
  };
  private async spin() {
    if (this.phase === 'spinning') { this.reels.forEach(reel => reel.skip()); return; }
    if (this.phase !== 'idle') return;
    if (!this.pending && this.credits < this.bet) { this.message.text = 'Insufficient credits'; return; }
    this.beforeSpin();
    try {
      // Keep this ID on uncertain failures. Retrying cannot charge the same spin twice.
      this.pending ??= { bet: this.bet, requestId: crypto.randomUUID() };
      const response = await this.api.spin(this.pending.bet, this.pending.requestId);
      this.pending = undefined;
      await this.onSpinResponse(response);
    } catch (error) {
      if (error instanceof ApiError) this.pending = undefined;
      try { const session = await this.api.session(); this.credits = session.credits; } catch { /* Retry preserves request ID. */ }
      this.message.text = `${error instanceof Error ? error.message : 'Connection failed'} • press SPIN to retry`;
    } finally {
      if (this.phase as Phase !== 'destroyed') {
        this.rulesPanel?.setEnabled(true);
        this.historyPanel?.setEnabled(true);
        this.phase = 'idle'; this.ui.setBusy(false);
        this.updateUI();
      }
    }
  }
  private beforeSpin() {
    this.historyPanel?.setEnabled(false);
    this.rulesPanel?.setEnabled(false);
    this.phase = 'requesting';
    this.clearEffects();
    this.win = 0;
    this.message.text = 'Waiting for result…';
    this.ui.setBusy(true); this.updateUI();
  }
  private async onSpinResponse(result: SpinResult) {
    this.phase = 'spinning'; this.credits = result.credits - result.totalWin; this.updateUI(); this.message.text = 'STOP or Space to skip'; this.ui.setBusy(true, true);
    await Promise.all(this.reels.map((reel, i) => reel.spin(result.grid[i], i)));
    this.afterStop(result);
  }
  private afterStop(result: SpinResult) {
    this.phase = 'presenting'; this.credits = result.credits; this.win = result.totalWin;
    this.message.text = this.win ? `WIN ${this.win} • ${result.winningLines.length} winning line(s)` : 'Ready • SPIN or Space';
    const showLine = (index: number) => {
      const win = result.winningLines[index]; if (!win) return;
      const points = rules.paylines[win.paylineIndex].slice(0, win.count).map((row, reel) => { const pos = this.reels[reel].getSymbolPosition(row); return new Point(pos.x, pos.y); });
      this.lines.draw(points);
    };
    if (result.winningLines.length) {
      showLine(0); let index = 0;
      this.lineTimer = window.setInterval(() => showLine(++index % result.winningLines.length), 1200);
      const animated = new Set<string>();
      result.winningLines.forEach(line => rules.paylines[line.paylineIndex].slice(0, line.count).forEach((row, reel) => { const key = `${reel}:${row}`; if (!animated.has(key)) { animated.add(key); this.reels[reel].danceSymbol(row); } }));
    }
    if (this.win >= result.bet * 10) this.showBigWin();
    this.updateUI();
  }
  private showBigWin() {
    const banner = this.banner = new Sprite(Texture.from('/assets/selebration/big-win-fixed.svg')); banner.anchor.set(0.5); banner.position.set(800, 450); banner.width = 700; banner.height = 230; this.app.stage.addChild(banner);
    gsap.to(banner, { alpha: 0, delay: 1.5, duration: 0.4, onComplete: () => { banner.destroy(); if (this.banner === banner) this.banner = undefined; } });
  }
  private clearEffects() { if (this.lineTimer) clearInterval(this.lineTimer); this.lineTimer = undefined; this.lines.clearLine(); this.reels.forEach(reel => reel.resetEffects()); if (this.banner) { gsap.killTweensOf(this.banner); this.banner.destroy(); this.banner = undefined; } }
  private changeBet(delta: number) { if (this.phase !== 'idle' || this.pending) return; this.bet = Math.max(rules.minBet, Math.min(rules.maxBet, this.bet + delta)); this.updateUI(); }
  private updateUI() { this.ui.updateCredits(this.credits); this.ui.updateBet(this.bet); this.ui.updateWin(this.win); }
  destroy() {
    this.historyPanel?.destroy();
    this.rulesPanel?.destroy();
    this.phase = 'destroyed';
    this.clearEffects();
    this.api.destroy();
    this.app.renderer.off("resize", this.resize);
    window.removeEventListener('keydown', this.keydown);
    this.reels.forEach(reel => reel.destroy());
  }
}
