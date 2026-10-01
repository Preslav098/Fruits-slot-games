import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateWin, config, gridFromStops, spin, strips } from '../engine.mjs';
test('strip windows wrap at their end', () => { const stops = strips.map(strip => strip.length - 1); const grid = gridFromStops(stops); strips.forEach((strip, i) => assert.deepEqual(grid[i], [strip.at(-1), strip[0], strip[1]])); });
test("five apples pay on all five lines", () => {
    const grid = Array.from(
        { length: 5 },
        () => ["apple", "apple", "apple"],
    );

    const result = calculateWin(grid, 10);

    assert.equal(result.winningLines.length, 5);

    // 5 lines × 10 bet × 18 multiplier.
    assert.equal(result.totalWin, 900);
});

test("only consecutive matches from the left pay", () => {
    const grid = [
        ["apple", "banana", "orange"],
        ["apple", "grape", "lemon"],
        ["apple", "bell", "bar"],
        ["banana", "cherry", "seven"],
        ["apple", "diamond", "grape"],
    ];

    const result = calculateWin(grid, 10);

    // 3 consecutive apples: 10 bet × 6 multiplier.
    assert.equal(result.totalWin, 60);
    assert.equal(result.winningLines.length, 1);
    assert.equal(result.winningLines[0].count, 3);
});
test('only consecutive matches from the left pay', () => { const grid = [['apple', 'banana', 'orange'], ['apple', 'grape', 'lemon'], ['apple', 'bell', 'bar'], ['banana', 'cherry', 'seven'], ['apple', 'diamond', 'grape']]; const result = calculateWin(grid, 10); assert.equal(result.totalWin, 60); assert.equal(result.winningLines[0].count, 3); });
test('invalid bets leave balance unchanged', () => { for (const bet of [-10, 0, 11, Infinity, 101, '10']) { const session = { credits: 1000 }; assert.throws(() => spin(session, bet)); assert.equal(session.credits, 1000); } });
test('insufficient funds leave balance unchanged', () => { const session = { credits: 0 }; assert.throws(() => spin(session, 10)); assert.equal(session.credits, 0); });
test('spin result and balance agree with stop positions', () => { const session = { credits: config.startCredits }; const result = spin(session, 10, () => 0); assert.deepEqual(result.grid, gridFromStops(result.stops)); assert.equal(session.credits, 1000 - 10 + result.totalWin); assert.equal(session.lastSpin, result); });
