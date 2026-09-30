import type { GameEvent, Session, SpinResult } from "../../../shared/contracts";
export class ApiError extends Error {}
export class SlotApi {
  private events?: EventSource;
  async session(): Promise<Session> { const response = await fetch('/api/session'); if (!response.ok) throw new Error('Cannot load session'); return response.json(); }
  connect(listener: (event: GameEvent) => void) {
    this.events = new EventSource('/api/events');
    this.events.onmessage = message => listener(JSON.parse(message.data) as GameEvent);
  }
  async spin(bet: number, requestId: string): Promise<SpinResult> {
    const response = await fetch('/api/spin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bet, requestId }) });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message ?? 'Spin failed');
    return data;
  }
  destroy() { this.events?.close(); }
}
