import { Application, Container, Text, TextStyle } from "pixi.js";
import { gsap } from "gsap";
import {
    createBottomPanel,
    createGreenSpinButton,
    createSmallBlueButton,
    createSmallRedButton,
    createValueBox,
} from "./CasinoStyle";

export class UI extends Container {
    private creditsText!: Text;
    private betText!: Text;
    private winText!: Text;
    private spinButton!: Container;

    private panelX = 0;
    private panelY = 0;
    private panelWidth = 1100;
    private panelHeight = 140;

    constructor(
        private app: Application,
        private onSpinClick: () => void,
        private onBetIncrease: () => void,
        private onBetDecrease: () => void
    ) {
        super();

        this.createBottomPanel();
        this.createContent();

        this.app.stage.addChild(this);
    }

    private createBottomPanel() {
        this.panelWidth = Math.min(1100, this.app.screen.width - 120);
        this.panelX = this.app.screen.width / 2 - this.panelWidth / 2;
        this.panelY = this.app.screen.height - this.panelHeight - 25;

        const panel = createBottomPanel(this.panelWidth, this.panelHeight);
        panel.x = this.panelX;
        panel.y = this.panelY;

        this.addChild(panel);
    }

    private createContent() {
        const centerY = this.panelY + this.panelHeight / 2;

        const labelStyle = new TextStyle({
            fill: 0xffd24a,
            fontSize: 18,
            fontWeight: "bold",
        });

        const valueStyle = new TextStyle({
            fill: "white",
            fontSize: 28,
            fontWeight: "bold",
        });

        const boxY = centerY - 35;
        const buttonY = centerY - 32.5;

        // CREDITS
        const creditsBox = createValueBox(170, 70);
        creditsBox.x = this.panelX + 55;
        creditsBox.y = boxY;
        this.addChild(creditsBox);

        this.addLabel("CREDITS", creditsBox.x + 85, creditsBox.y + 18, labelStyle);

        this.creditsText = this.addValue("1000", creditsBox.x + 85, creditsBox.y + 48, valueStyle);

        // MINUS
        const minus = createSmallRedButton(65);
        minus.x = this.panelX + 245;
        minus.y = buttonY;
        minus.eventMode = "static";
        minus.cursor = "pointer";
        minus.on("pointerdown", () => this.onBetDecrease());
        this.addChild(minus);
        this.addButtonText("-", minus.x + 32.5, minus.y + 30, 48);

        // BET
        const betBox = createValueBox(150, 70);
        betBox.x = this.panelX + 335;
        betBox.y = boxY;
        this.addChild(betBox);

        this.addLabel("BET", betBox.x + 75, betBox.y + 18, labelStyle);

        this.betText = this.addValue("10", betBox.x + 75, betBox.y + 48, valueStyle);

        // PLUS
        const plus = createSmallBlueButton(65);
        plus.x = this.panelX + 510;
        plus.y = buttonY;
        plus.eventMode = "static";
        plus.cursor = "pointer";
        plus.on("pointerdown", () => this.onBetIncrease());
        this.addChild(plus);
        this.addButtonText("+", plus.x + 32.5, plus.y + 32.5, 42);

        // SPIN
        this.spinButton = createGreenSpinButton(250, 88);
        this.spinButton.x = this.panelX + 605;
        this.spinButton.y = centerY - 44;
        this.spinButton.eventMode = "static";
        this.spinButton.cursor = "pointer";
        this.spinButton.on("pointerdown", () => this.onSpinClick());
        this.addChild(this.spinButton);

        const spinText = new Text({
            text: "SPIN",
            style: new TextStyle({
                fill: 0xfff4b5,
                fontSize: 44,
                fontWeight: "bold",
                stroke: {
                    color: 0x004400,
                    width: 4,
                },
            }),
        });

        spinText.anchor.set(0.5);
        spinText.x = this.spinButton.x + 125;
        spinText.y = this.spinButton.y + 44;
        this.addChild(spinText);

        // WIN
        const winBox = createValueBox(170, 70, true);
        winBox.x = this.panelX + this.panelWidth - 225;
        winBox.y = boxY;
        this.addChild(winBox);

        this.addLabel("WIN", winBox.x + 85, winBox.y + 18, labelStyle);

        this.winText = this.addValue("0", winBox.x + 85, winBox.y + 48, new TextStyle({
            fill: 0xffff66,
            fontSize: 28,
            fontWeight: "bold",
        }));
    }

    private addLabel(text: string, x: number, y: number, style: TextStyle) {
        const label = new Text({ text, style });
        label.anchor.set(0.5);
        label.x = x;
        label.y = y;
        this.addChild(label);
    }

    private addValue(text: string, x: number, y: number, style: TextStyle): Text {
        const value = new Text({ text, style });
        value.anchor.set(0.5);
        value.x = x;
        value.y = y;
        this.addChild(value);
        return value;
    }

    private addButtonText(text: string, x: number, y: number, fontSize: number) {
        const buttonText = new Text({
            text,
            style: new TextStyle({
                fill: "white",
                fontSize,
                fontWeight: "bold",
            }),
        });

        buttonText.anchor.set(0.5);
        buttonText.x = x;
        buttonText.y = y;
        this.addChild(buttonText);
    }

    public setSpinEnabled(enabled: boolean) {
        this.spinButton.eventMode = enabled ? "static" : "none";

        gsap.to(this.spinButton, {
            alpha: enabled ? 1 : 0.5,
            duration: 0.25,
        });
    }

    updateCredits(value: number) {
        this.creditsText.text = `${value}`;
    }

    updateBet(value: number) {
        this.betText.text = `${value}`;
    }

    updateWin(value: number) {
        this.winText.text = `${value}`;
    }
}