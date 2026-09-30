import { gsap } from "gsap";
import type { ReelSpinConfig } from "../config/SpingConfig";

export class ReelAnimator {
  private timeline?: gsap.core.Timeline;

  constructor(private config: ReelSpinConfig) { }

  animate(
    state: { position: number },
    target: number,
    index: number,
    update: () => void,
    complete: () => void,
  ): Promise<void> {
    return new Promise((resolve) => {
      const start = state.position;
      const distance = target - start;
      const duration =
        this.config.duration + index * this.config.stagger;

      this.timeline = gsap.timeline({
        onUpdate: update,
        onComplete: () => {
          this.timeline = undefined;
          complete();
          resolve();
        },
      });

      this.timeline
        .to(state, {
          position: start + distance * 0.1,
          duration: duration * 0.2,
          ease: "power1.in",
        })
        .to(state, {
          position: start + distance * 0.7,
          duration: duration * 0.6,
          ease: "none",
        })
        .to(state, {
          position: target,
          duration: duration * 0.2,
          ease: "power1.out",
        });
    });
  }

  skip() {
    const timeline = this.timeline;
    if (!timeline) return;

    const remaining = timeline.duration() - timeline.time();

    timeline.timeScale(
      Math.max(1, remaining / this.config.skipDuration),
    );
  }

  destroy() {
    const timeline = this.timeline;
    if (!timeline) return;

    timeline.progress(1);
    timeline.kill();
    this.timeline = undefined;
  }
}