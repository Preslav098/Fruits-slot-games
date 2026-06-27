import { Container, Graphics, Sprite, Texture } from "pixi.js";

const REEL_FRAME_ASSET = "/assets/ui-kit/reel-frame.svg";

export const CasinoColors = {
    goldLight: 0xfff4b5,
    gold: 0xedd040,
    goldMid: 0xc9a020,
    goldDark: 0x6b4a00,

    pageDark: 0x06000f,
    purpleDark: 0x0e0028,
    purple: 0x200068,
    purpleDeep: 0x0e002e,
    purpleBright: 0x32009e,

    symbolDark: 0x0e0034,
    symbolPurple: 0x240072,

    greenTop: 0x00ff78,
    greenMid: 0x00cc58,
    greenDark: 0x007030,

    redTop: 0xff5a5a,
    redDark: 0x991111,

    blueTop: 0x5599ff,
    blueDark: 0x1144aa,
};

export function createGoldFrame(
    width: number,
    height: number,
    radius: number,
    innerColor: number,
    thick = 5
): Container {
    const c = new Container();

    const glow = new Graphics();
    glow.roundRect(-8, -8, width + 16, height + 16, radius + 8);
    glow.fill(CasinoColors.goldMid);
    glow.alpha = 0.48;
    c.addChild(glow);

    const outer = new Graphics();
    outer.roundRect(0, 0, width, height, radius);
    outer.fill(CasinoColors.goldLight);
    c.addChild(outer);

    const gold1 = new Graphics();
    gold1.roundRect(2, 2, width - 4, height - 4, radius - 2);
    gold1.fill(CasinoColors.gold);
    c.addChild(gold1);

    const border = 8;

    const gold2 = new Graphics();
    gold2.roundRect(
        border,
        border,
        width - border * 2,
        height - border * 2,
        radius - border
    );
    gold2.fill(CasinoColors.goldDark);
    c.addChild(gold2);

    const inner = new Graphics();
    inner.roundRect(
        thick + 3,
        thick + 3,
        width - (thick + 3) * 2,
        height - (thick + 3) * 2,
        radius - thick - 3
    );
    inner.fill(innerColor);
    c.addChild(inner);

    const gloss = new Graphics();
    gloss.roundRect(
        thick + 6,
        thick + 6,
        width - (thick + 6) * 2,
        height * 0.35,
        radius - thick - 6
    );
    gloss.fill(0xffffff);
    gloss.alpha = 0.16;
    c.addChild(gloss);

    return c;
}

export function createReelFrame(width: number, height: number): Container {
    const c = new Container();

    const frame = new Sprite(Texture.from(REEL_FRAME_ASSET));
    frame.width = width;
    frame.height = height;
    c.addChild(frame);

    return c;
}

export function createSymbolCell(size: number): Container {
    const c = createGoldFrame(size, size, 16, CasinoColors.symbolPurple, 3);

    const innerRing = new Graphics();
    innerRing.roundRect(8, 8, size - 16, size - 16, 9);
    innerRing.stroke({
        color: 0xa03cff,
        width: 1,
        alpha: 0.4,
    });
    c.addChild(innerRing);

    return c;
}

export function createGreenSpinButton(width: number, height: number): Container {
    return createGoldFrame(width, height, 24, CasinoColors.greenMid, 5);
}

export function createSmallRedButton(size: number): Container {
    return createGoldFrame(size, size, 17, CasinoColors.redDark, 3);
}

export function createSmallBlueButton(size: number): Container {
    return createGoldFrame(size, size, 17, CasinoColors.blueDark, 3);
}

export function createBottomPanel(width: number, height: number): Container {
    return createGoldFrame(width, height, 32, CasinoColors.purpleDeep, 4);
}

export function createValueBox(width: number, height: number, isWin = false): Container {
    return createGoldFrame(
        width,
        height,
        15,
        isWin ? 0x421a00 : 0x190058,
        2
    );
}