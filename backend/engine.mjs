import { randomInt, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
export const config = JSON.parse(readFileSync(new URL('../shared/game-config.json', import.meta.url)));
export const strips = JSON.parse(readFileSync(new URL('./config/reel-strips.json', import.meta.url)));
export function validateConfig() {
  const fail = (message) => {
    throw new Error(`Invalid game configuration: ${message}`);
  };

  if (
    !Number.isSafeInteger(config.visibleRows) ||
    config.visibleRows < 1
  ) {
    fail("visibleRows must be a positive integer");
  }

  if (!Array.isArray(strips) || strips.length === 0) {
    fail("at least one reel strip is required");
  }

  if (
    !config.paytable ||
    typeof config.paytable !== "object" ||
    Array.isArray(config.paytable)
  ) {
    fail("paytable must be an object");
  }

  for (const [symbol, payouts] of Object.entries(
    config.paytable,
  )) {
    if (
      !payouts ||
      typeof payouts !== "object" ||
      Array.isArray(payouts)
    ) {
      fail(`"${symbol}" must have a payout table`);
    }

    for (let count = 3; count <= strips.length; count++) {
      const multiplier = payouts[count];

      if (
        !Number.isSafeInteger(multiplier) ||
        multiplier < 0
      ) {
        fail(
          `invalid payout for "${symbol}", ${count} matches`,
        );
      }
    }

    for (const count of Object.keys(payouts)) {
      const value = Number(count);

      if (
        !Number.isSafeInteger(value) ||
        value < 3 ||
        value > strips.length ||
        String(value) !== count
      ) {
        fail(`invalid match count "${count}" for "${symbol}"`);
      }
    }
  }

  strips.forEach((strip, reelIndex) => {
    if (
      !Array.isArray(strip) ||
      strip.length < config.visibleRows
    ) {
      fail(`reel ${reelIndex}: strip is too short`);
    }

    strip.forEach((symbol, position) => {
      if (
        typeof symbol !== "string" ||
        !Object.hasOwn(config.paytable, symbol)
      ) {
        fail(
          `reel ${reelIndex}, position ${position}: ` +
          `unknown symbol "${symbol}"`,
        );
      }
    });
  });

  if (
    !Array.isArray(config.paylines) ||
    config.paylines.length === 0
  ) {
    fail("at least one payline is required");
  }

  const seenLines = new Set();

  config.paylines.forEach((line, index) => {
    if (!Array.isArray(line) || line.length !== strips.length) {
      fail(`payline ${index}: expected ${strips.length} rows`);
    }

    line.forEach((row) => {
      if (
        !Number.isSafeInteger(row) ||
        row < 0 ||
        row >= config.visibleRows
      ) {
        fail(`payline ${index}: invalid row "${row}"`);
      }
    });

    const key = JSON.stringify(line);

    if (seenLines.has(key)) {
      fail(`payline ${index}: duplicate line`);
    }

    seenLines.add(key);
  });

  for (const name of ["minBet", "maxBet", "betStep"]) {
    if (
      !Number.isSafeInteger(config[name]) ||
      config[name] <= 0
    ) {
      fail(`${name} must be a positive integer`);
    }
  }

  if (
    config.minBet > config.maxBet ||
    config.minBet % config.betStep !== 0 ||
    config.maxBet % config.betStep !== 0
  ) {
    fail("bet limits must match betStep");
  }

  if (
    !Number.isSafeInteger(config.startCredits) ||
    config.startCredits < 0
  ) {
    fail("startCredits must be a non-negative integer");
  }
}

validateConfig();
export function gridFromStops(stops) {
  return strips.map((strip, reel) => Array.from({ length: config.visibleRows }, (_, row) => strip[(stops[reel] + row) % strip.length]));
}
export function calculateWin(grid, bet) {
  const winningLines = [];

  config.paylines.forEach((line, paylineIndex) => {
    const symbol = grid[0][line[0]];

    let count = 1;

    while (
      count < strips.length &&
      grid[count][line[count]] === symbol
    ) {
      count++;
    }

    if (count < 3) return;

    const multiplier = config.paytable[symbol]?.[count];

    if (
      !Number.isSafeInteger(multiplier) ||
      multiplier < 0
    ) {
      throw new Error(
        `Invalid payout for ${symbol}, ${count} matches`,
      );
    }

    if (multiplier === 0) return;

    winningLines.push({
      paylineIndex,
      symbol,
      count,
      payout: bet * multiplier,
    });
  });

  return {
    winningLines,
    totalWin: winningLines.reduce(
      (sum, line) => sum + line.payout,
      0,
    ),
  };
}
export function spin(session, bet, rng = randomInt) {
  if (!Number.isSafeInteger(bet) || bet < config.minBet || bet > config.maxBet || bet % config.betStep !== 0) throw new Error('Invalid bet');
  if (session.credits < bet) throw new Error('Insufficient credits');
  const stops = strips.map(strip => rng(strip.length));
  const grid = gridFromStops(stops);
  const win = calculateWin(grid, bet);
  session.credits += win.totalWin - bet;
  const result = { spinId: randomUUID(), bet, stops, grid, ...win, credits: session.credits };
  session.lastSpin = result;
  return result;
}
