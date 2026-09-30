export interface ReelSpinConfig {
    duration: number;
    stagger: number;
    turns: number;
    blur: number;
    skipDuration: number;
}

export const SpinConfig: ReelSpinConfig = {
    duration: 1.8,
    stagger: 0.13,
    turns: 4,
    blur: 7,
    skipDuration: 0.12,
};