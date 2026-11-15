// Savings challenges. Each one is just a list of amounts to tick off; ticking one adds a deposit to a jar.
import { minorDigits } from "./money.js";

export const CHALLENGE_TYPES = {
  envelopes: { name: "100 envelopes", blurb: "Pick an envelope, save what's inside. Any order, your pace." },
  weeks52: { name: "52 weeks", blurb: "One small step a week for a year, growing as you go." },
  nospend: { name: "No-spend month", blurb: "Mark each day you spend nothing extra. Bank what you kept." },
};

/** Small deterministic random generator so a shuffled challenge looks the same every time it is opened. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Envelope amounts 1x, 2x … Nx scaled so they add up to exactly `target` (all in minor units).
 * Classic: 100 envelopes of 1..100 in whole currency units = 5,050.
 */
export function envelopeAmounts(count, target) {
  if (!Number.isInteger(count) || count < 5 || count > 200) throw new RangeError("count");
  if (!Number.isSafeInteger(target) || target < count) throw new RangeError("target");
  const weightSum = (count * (count + 1)) / 2;
  const amounts = [];
  let used = 0;
  for (let i = 1; i <= count; i++) {
    const a = i === count ? target - used : Math.max(1, Math.round((target * i) / weightSum));
    amounts.push(a);
    used += a;
  }
  if (amounts[count - 1] < 1) throw new RangeError("target");
  return amounts;
}

/** Display order for envelopes: shuffled so picking feels like a draw, stable for a given seed. */
export function shuffledOrder(count, seed) {
  const r = rng(seed);
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** 52-week plan. classic: week n saves n×step. reverse: starts high and shrinks. flat: same every week. */
export function weekAmounts(mode, step) {
  if (!Number.isSafeInteger(step) || step < 1) throw new RangeError("step");
  return Array.from({ length: 52 }, (_, i) => (mode === "flat" ? step : mode === "reverse" ? (52 - i) * step : (i + 1) * step));
}

export function daysInMonth(year, month /* 1-12 */) {
  return new Date(year, month, 0).getDate();
}

export const sum = (list) => list.reduce((s, n) => s + n, 0);

/** The list of amounts for a stored challenge. */
export function challengeAmounts(ch) {
  if (ch.type === "envelopes") return envelopeAmounts(ch.config.count, ch.config.target);
  if (ch.type === "weeks52") return weekAmounts(ch.config.mode, ch.config.step);
  if (ch.type === "nospend") return Array.from({ length: daysInMonth(ch.config.year, ch.config.month) }, () => ch.config.perDay);
  return [];
}

export function challengeProgress(ch) {
  const amounts = challengeAmounts(ch);
  const doneIdx = Object.keys(ch.done).map(Number).filter((i) => i >= 0 && i < amounts.length);
  const saved = doneIdx.reduce((s, i) => s + amounts[i], 0);
  const total = sum(amounts);
  return { amounts, count: amounts.length, doneCount: doneIdx.length, saved, total, ratio: total ? saved / total : 0, complete: doneIdx.length === amounts.length };
}

/** A sensible default step/target in the user's currency (whole units → minor units). */
export function unitsToMinor(units, currency) {
  return Math.round(units * 10 ** minorDigits(currency));
}
