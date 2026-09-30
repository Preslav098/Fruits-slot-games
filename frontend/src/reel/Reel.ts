import type { SymbolType } from "../interfaces/SymbolType";
import type { ReelSpinConfig } from "../config/SpingConfig";
import { Config } from "../config/Config";
import { ReelAnimator } from "./ReelAnimator";
import { ReelView } from "./ReelView";
import { ReelStrip, visualStrip } from "./ReelStrip";

export class Reel extends ReelView {
  private strip = new ReelStrip(visualStrip());
  private state = { position: 0 };
  private animator: ReelAnimator;

  private result: SymbolType[] = this.strip.getWindow(
    0,
    Config.visibleRows,
  );
  private lastPosition = 0;
  private lastFrameTime = 0;

  constructor(private spinConfig: ReelSpinConfig) {
    super();

    this.animator = new ReelAnimator(this.spinConfig);
    this.resetMotionTracking();
    this.renderPosition();
  }

  private resetMotionTracking() {
    this.lastPosition = this.state.position;
    this.lastFrameTime = performance.now();
  }

  private renderPosition = () => {
    const now = performance.now();

    const elapsed = Math.max(
      (now - this.lastFrameTime) / 1000,
      0.001,
    );

    const speed =
      Math.abs(this.state.position - this.lastPosition) /
      elapsed;

    const blurStrength = Math.min(
      this.spinConfig.blur,
      speed * 0.25,
    );

    this.renderStrip(
      this.strip.symbols,
      this.state.position,
      blurStrength,
    );

    this.lastPosition = this.state.position;
    this.lastFrameTime = now;
  };

  async spin(result: SymbolType[], index: number) {
    this.resetEffects();
    this.result = [...result];

    const target =
      Math.round(this.state.position) +
      this.strip.length * this.spinConfig.turns +
      Math.floor(this.strip.length / 2);

    this.strip.setWindow(target, result);

    this.resetMotionTracking();
    this.clearBlur();

    await this.animator.animate(
      this.state,
      target,
      index,
      this.renderPosition,
      () => {
        this.state.position = target % this.strip.length;

        this.resetMotionTracking();
        this.renderPosition();
        this.clearBlur();
      },
    );
  }

  setResult(result: SymbolType[]) {
    this.resetEffects();
    this.result = [...result];

    this.strip.setWindow(0, result);

    this.state.position = 0;

    this.resetMotionTracking();
    this.renderPosition();
    this.clearBlur();
  }

  skip() {
    this.animator.skip();
  }

  getVisibleSymbols(): SymbolType[] {
    return [...this.result];
  }

  override destroy() {
    this.animator.destroy();
    super.destroy();
  }
}