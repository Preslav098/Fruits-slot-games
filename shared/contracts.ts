import type { SymbolType } from "./SymbolType";
export interface WinningLine { paylineIndex: number; symbol: SymbolType; count: number; payout: number }
export interface SpinResult { spinId: string; bet: number; grid: SymbolType[][]; stops: number[]; totalWin: number; winningLines: WinningLine[]; credits: number }
export interface Session { credits: number; lastSpin: SpinResult | null }
export type GameEvent = { type: "session"; session: Session } | { type: "spin:result"; result: SpinResult } | { type: "spin:error"; message: string };
