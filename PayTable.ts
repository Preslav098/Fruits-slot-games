import { SymbolType } from "./SymbolType";

export const PAYTABLE: Record<SymbolType, number> = {
    [SymbolType.Apple]: 2,
    [SymbolType.Banana]: 3,
    [SymbolType.BlueBerry]: 5,
    [SymbolType.Grape]: 8,
    [SymbolType.RedBerry]: 10,
    [SymbolType.Cherry]: 12,
    [SymbolType.Watermelon]: 12,
    [SymbolType.Lemon]: 14,
    [SymbolType.Orange]: 14,
    [SymbolType.Bell]: 16,
    [SymbolType.Diamond]: 20,
    [SymbolType.Bar]: 25,
    [SymbolType.LuckySeven]: 50,
};