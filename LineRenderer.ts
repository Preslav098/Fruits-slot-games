import { Container, Graphics, Point } from "pixi.js";
import { gsap } from "gsap";

export class LineRenderer extends Container {
    private graphics = new Graphics();

    constructor() {
        super();
        this.addChild(this.graphics);
    }

    draw(points: Point[]) {
        this.graphics.clear();

        this.graphics.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            this.graphics.lineTo(points[i].x, points[i].y);
        }

        this.graphics.stroke({
            color: 0xffff00,
            width: 8,
            alpha: 0.95,
        });

        this.alpha = 0;

        gsap.to(this, {
            alpha: 1,
            duration: 0.25,
        });
    }

    clearLine() {
        this.graphics.clear();
    }
}