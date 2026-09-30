import { Application, Sprite, Texture, Point, Text, TextStyle } from "pixi.js";
import { gsap } from "gsap";
import { Reel } from "./reel/Reel";
import { UI } from "./ui/UI";
import { Config } from "./config/Config";
import { AssetLoader } from "./AssetLoader";
import { SlotApi, ApiError } from "./api/SlotApi";
import { LineRenderer } from "./effects/LineRenderer";
import rules from "../../shared/game-config.json";
import type { SpinResult } from "../../shared/contracts";
import { createReelFrame } from "./CasinoStyle";
import { SpinConfig } from "./config/SpingConfig";
type Phase = 'loading' | 'idle' | 'requesting' | 'spinning' | 'presenting' | 'destroyed';
export class Game {
  private reels: Reel[] = [];
  private api = new SlotApi();
  private ui!: UI;
  private lines = new LineRenderer();
  private message = new Text({ text: 'Connecting…', style: new TextStyle({ fill: 'white', fontSize: 24 }) });
  private phase: Phase = 'loading';
  private credits = 0;
  private bet = Config.defaultBet;
  private win = 0;
  private banner?: Sprite;
  private lineTimer?: number;
  private pending?: { bet: number; requestId: string };
  constructor(private app: Application) { }
  async init() {
    await AssetLoader.load();
    const background = new Sprite(Texture.from('/assets/ui-kit/casino-background.svg')); background.width = 1600; background.height = 1020; this.app.stage.addChild(background);
    const logo = new Sprite(Texture.from('/assets/ui-kit/fruits-logo.svg')); logo.anchor.set(0.5, 0); logo.width = 600; logo.height = 100; logo.position.set(800, 10); this.app.stage.addChild(logo);
    const frameWidth =
      Config.reelWidth + (Config.reelCount - 1) * 265;

    const frame = new Sprite(
      Texture.from("/assets/ui-kit/reel-frame.svg"),
    );

    frame.position.set(135, 120);
    frame.width = frameWidth;
    frame.height = Config.reelHeight;

    for (let i = 0; i < Config.reelCount; i++) {
      const reel = new Reel({ ...SpinConfig });

      reel.position.set(
        135 + 70 + i * Config.reelWidth,
        120,
      );

      this.reels.push(reel);
      this.app.stage.addChild(reel);
    }

    // Общата рамка е над петте колони.
    this.app.stage.addChild(frame);
    this.app.stage.addChild(frame);

    this.app.stage.addChild(this.lines);
    this.ui = new UI(this.app, () => { void this.spin(); }, () => this.changeBet(10), () => this.changeBet(-10));
    this.message.anchor.set(0.5); this.message.position.set(800, 840); this.app.stage.addChild(this.message);
    this.resize(); window.addEventListener('resize', this.resize);
    window.addEventListener('keydown', this.keydown);
    this.ui.setBusy(true);
    try {
      const session = await this.api.session();
      this.credits = session.credits;
      if (session.lastSpin) {
        this.win = session.lastSpin.totalWin; this.reels.forEach((reel, i) => reel.setResult(session.lastSpin!.grid[i]));
      }
      this.api.connect(event => {
        if (this.phase === 'idle' && event.type === 'session') { this.credits = event.session.credits; this.updateUI(); }
        if (this.phase === 'idle' && event.type === 'spin:result') { this.credits = event.result.credits; this.win = event.result.totalWin; this.reels.forEach((reel, i) => reel.setResult(event.result.grid[i])); this.updateUI(); }
      });
      this.phase = 'idle'; this.message.text = 'Ready • SPIN or Space'; this.ui.setBusy(false); this.updateUI();
    } catch { this.message.text = 'Start the API server and reload the page.'; }
  }
  private resize = () => {
    const scale = Math.min(this.app.screen.width / 1600, this.app.screen.height / 1020);
    this.app.stage.scale.set(scale); this.app.stage.position.set((this.app.screen.width - 1600 * scale) / 2, (this.app.screen.height - 1020 * scale) / 2);
  };
  private keydown = (event: KeyboardEvent) => { if (event.code === 'Space' && !event.repeat) { event.preventDefault(); void this.spin(); } };
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
      if (this.phase as Phase !== 'destroyed') { this.phase = 'idle'; this.ui.setBusy(false); this.updateUI(); }
    }
  }
  private beforeSpin() { this.phase = 'requesting'; this.clearEffects(); this.win = 0; this.message.text = 'Waiting for result…'; this.ui.setBusy(true); this.updateUI(); }
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
  destroy() { this.phase = 'destroyed'; this.clearEffects(); this.api.destroy(); window.removeEventListener('resize', this.resize); window.removeEventListener('keydown', this.keydown); this.reels.forEach(reel => reel.destroy()); }
}
