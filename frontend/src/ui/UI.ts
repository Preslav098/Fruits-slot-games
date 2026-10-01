import {
    Application,
    Container,
    Text,
    TextStyle,
} from "pixi.js";

import {
    createBottomPanel,
    createGreenSpinButton,
    createSmallBlueButton,
    createSmallRedButton,
    createValueBox,
} from "../CasinoStyle";

export class UI extends Container {
    private credits = 0;
    private bet = 10;
    private win = 0;

    private busy = false;
    private canSkip = false;
    private spinEnabled = true;

    private creditsText!: Text;
    private betText!: Text;
    private winText!: Text;
    private spinText!: Text;

    private spinButton!: Container;
    private betButtons: Container[] = [];

    constructor(
        app: Application,
        private onSpinClick: () => void,
        private onBetIncrease: () => void,
        private onBetDecrease: () => void,
    ) {
        super();

        app.stage.addChild(this);
    }

    static heightFor(portrait: boolean): number {
        return portrait ? 160 : 100;
    }

    resize(width: number, portrait: boolean) {
        // Запазваме стойностите и състоянието при нова подредба.
        const previousChildren = this.removeChildren();

        previousChildren.forEach((child) => {
            child.destroy({ children: true });
        });

        this.betButtons = [];

        const height = UI.heightFor(portrait);

        this.addChild(createBottomPanel(width, height));

        if (portrait) {
            this.createPortraitLayout(width);
        } else {
            this.createWideLayout(width, height);
        }

        this.applyState();
    }

    private createPortraitLayout(width: number) {
        const padding = 12;
        const gap = 8;
        const boxWidth = (width - padding * 2 - gap * 2) / 3;

        this.creditsText = this.createStat(
            "CREDITS",
            this.credits,
            padding,
            10,
            boxWidth,
            60,
        );

        this.betText = this.createStat(
            "BET",
            this.bet,
            padding + boxWidth + gap,
            10,
            boxWidth,
            60,
        );

        this.winText = this.createStat(
            "WIN",
            this.win,
            padding + (boxWidth + gap) * 2,
            10,
            boxWidth,
            60,
            true,
        );

        const buttonSize = 56;
        const buttonY = 88;

        this.createBetButton(
            false,
            padding,
            buttonY,
            buttonSize,
        );

        this.createBetButton(
            true,
            width - padding - buttonSize,
            buttonY,
            buttonSize,
        );

        const spinX = padding + buttonSize + gap;
        const spinWidth =
            width - padding * 2 - buttonSize * 2 - gap * 2;

        this.createSpinButton(
            spinX,
            buttonY,
            spinWidth,
            buttonSize,
        );
    }

    private createWideLayout(width: number, height: number) {
        const padding = 12;
        const gap = 8;
        const buttonSize = 48;

        const spinWidth = Math.min(
            200,
            Math.max(100, width * 0.22),
        );

        const boxWidth =
            (
                width -
                padding * 2 -
                gap * 5 -
                buttonSize * 2 -
                spinWidth
            ) / 3;

        const boxHeight = 64;
        const boxY = (height - boxHeight) / 2;
        const buttonY = (height - buttonSize) / 2;

        let x = padding;

        this.creditsText = this.createStat(
            "CREDITS",
            this.credits,
            x,
            boxY,
            boxWidth,
            boxHeight,
        );

        x += boxWidth + gap;

        this.createBetButton(false, x, buttonY, buttonSize);

        x += buttonSize + gap;

        this.betText = this.createStat(
            "BET",
            this.bet,
            x,
            boxY,
            boxWidth,
            boxHeight,
        );

        x += boxWidth + gap;

        this.createBetButton(true, x, buttonY, buttonSize);

        x += buttonSize + gap;

        this.createSpinButton(
            x,
            boxY,
            spinWidth,
            boxHeight,
        );

        x += spinWidth + gap;

        this.winText = this.createStat(
            "WIN",
            this.win,
            x,
            boxY,
            boxWidth,
            boxHeight,
            true,
        );
    }

    private createStat(
        label: string,
        value: number,
        x: number,
        y: number,
        width: number,
        height: number,
        isWin = false,
    ): Text {
        const box = createValueBox(width, height, isWin);

        box.position.set(x, y);
        this.addChild(box);

        const labelText = new Text({
            text: label,
            style: new TextStyle({
                fill: 0xffd24a,
                fontSize: width < 100 ? 11 : 13,
                fontWeight: "bold",
            }),
        });

        labelText.anchor.set(0.5);
        labelText.position.set(x + width / 2, y + 17);
        labelText.eventMode = "none";

        const valueText = new Text({
            text: String(value),
            style: new TextStyle({
                fill: isWin ? 0xffff66 : 0xffffff,
                fontSize: width < 100 ? 19 : 23,
                fontWeight: "bold",
            }),
        });

        valueText.anchor.set(0.5);
        valueText.position.set(
            x + width / 2,
            y + height - 20,
        );

        valueText.eventMode = "none";

        this.addChild(labelText, valueText);

        return valueText;
    }

    private createBetButton(
        increase: boolean,
        x: number,
        y: number,
        size: number,
    ) {
        const button = increase
            ? createSmallBlueButton(size)
            : createSmallRedButton(size);

        button.position.set(x, y);
        button.cursor = "pointer";

        // pointertap работи с мишка и докосване.
        button.on("pointertap", () => {
            if (this.busy) return;

            if (increase) {
                this.onBetIncrease();
            } else {
                this.onBetDecrease();
            }
        });

        const text = new Text({
            text: increase ? "+" : "−",
            style: new TextStyle({
                fill: 0xffffff,
                fontSize: 34,
                fontWeight: "bold",
            }),
        });

        text.anchor.set(0.5);
        text.position.set(x + size / 2, y + size / 2);
        text.eventMode = "none";

        this.addChild(button, text);
        this.betButtons.push(button);
    }

    private createSpinButton(
        x: number,
        y: number,
        width: number,
        height: number,
    ) {
        this.spinButton = createGreenSpinButton(width, height);

        this.spinButton.position.set(x, y);
        this.spinButton.cursor = "pointer";

        this.spinButton.on("pointertap", () => {
            if (this.spinEnabled) this.onSpinClick();
        });

        this.spinText = new Text({
            text: "SPIN",
            style: new TextStyle({
                fill: 0xfff4b5,
                fontSize: width < 150 ? 26 : 32,
                fontWeight: "bold",
                stroke: {
                    color: 0x004400,
                    width: 2,
                },
            }),
        });

        this.spinText.anchor.set(0.5);

        this.spinText.position.set(
            x + width / 2,
            y + height / 2,
        );

        this.spinText.eventMode = "none";

        this.addChild(this.spinButton, this.spinText);
    }

    private applyState() {
        this.betButtons.forEach((button) => {
            button.eventMode = this.busy ? "none" : "static";
            button.alpha = this.busy ? 0.45 : 1;
        });

        if (!this.spinButton) return;

        this.spinButton.eventMode =
            this.spinEnabled ? "static" : "none";

        this.spinButton.alpha = this.spinEnabled ? 1 : 0.5;

        this.spinText.text = this.busy
            ? this.canSkip
                ? "STOP"
                : "WAIT"
            : "SPIN";

        this.fitValue(this.creditsText);
        this.fitValue(this.betText);
        this.fitValue(this.winText);
    }

    private fitValue(text: Text) {
        text.scale.set(1);

        const availableWidth = this.betButtons.length
            ? Math.max(
                40,
                // Ограничаваме дългите числа спрямо разстоянието
                // между центровете на съседните стойности.
                Math.abs(this.betText.x - this.creditsText.x) - 20,
            )
            : 80;

        if (text.width > availableWidth) {
            text.scale.set(availableWidth / text.width);
        }
    }

    setSpinEnabled(enabled: boolean) {
        this.spinEnabled = enabled;
        this.applyState();
    }

    setBusy(busy: boolean, canSkip = false) {
        this.busy = busy;
        this.canSkip = canSkip;
        this.spinEnabled = !busy || canSkip;

        this.applyState();
    }

    updateCredits(value: number) {
        this.credits = value;

        if (this.creditsText) {
            this.creditsText.text = String(value);
            this.fitValue(this.creditsText);
        }
    }

    updateBet(value: number) {
        this.bet = value;

        if (this.betText) {
            this.betText.text = String(value);
            this.fitValue(this.betText);
        }
    }

    updateWin(value: number) {
        this.win = value;

        if (this.winText) {
            this.winText.text = String(value);
            this.fitValue(this.winText);
        }
    }
}