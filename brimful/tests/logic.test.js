import test from "node:test";
import assert from "node:assert/strict";
import { toMinor, fmt, minorDigits, quickAmounts, toInput, isCurrency } from "../assets/js/lib/money.js";
import { envelopeAmounts, weekAmounts, shuffledOrder, sum, challengeProgress, daysInMonth } from "../assets/js/lib/challenges.js";
import * as S from "../assets/js/lib/store.js";

test("money: parsing is exact and strict", () => {
  assert.equal(toMinor("1,250.50", "USD"), 125050);
  assert.equal(toMinor("0.1", "USD") + toMinor("0.2", "USD"), 30);
  assert.equal(toMinor("500", "JPY"), 500);
  assert.equal(toMinor("12.5", "JPY"), null);
  assert.equal(toMinor("12.500", "USD"), 1250);
  assert.equal(toMinor("12.505", "USD"), null);
  for (const bad of ["", "-5", "abc", "1e9", "1.2.3", " ", "99999999999999999999"]) assert.equal(toMinor(bad, "USD"), null, bad);
});
test("money: formatting", () => {
  assert.equal(minorDigits("ETB"), 2);
  assert.match(fmt(125050, "USD"), /1,250\.50/);
  assert.match(fmt(500000, "ETB", { short: true }), /5,000$/);
  assert.match(fmt(-2500, "USD"), /^−/);
  assert.equal(toInput(125050, "USD"), "1250.50");
  assert.equal(toInput(120000, "USD"), "1200");
  assert.ok(isCurrency("ETB") && !isCurrency("etb") && !isCurrency("XX"));
});
test("money: quick amounts are 3 increasing round numbers", () => {
  const q = quickAmounts(toMinor("5000", "ETB"), "ETB");
  assert.equal(q.length, 3);
  assert.ok(q[0] < q[1] && q[1] < q[2]);
  assert.deepEqual(q, [5000, 25000, 50000]);
});

test("envelopes: classic 100 = 5,050 and custom targets add up exactly", () => {
  const classic = envelopeAmounts(100, 505000);
  assert.equal(sum(classic), 505000);
  assert.equal(classic[0], 100);
  assert.equal(classic[99], 10000);
  for (const [n, target] of [[100, 1000000], [30, 77777], [5, 5], [200, 12345678]]) {
    const a = envelopeAmounts(n, target);
    assert.equal(a.length, n);
    assert.equal(sum(a), target);
    assert.ok(a.every((x) => x >= 1));
  }
  assert.throws(() => envelopeAmounts(100, 50));
  assert.throws(() => envelopeAmounts(3, 1000));
});
test("envelopes: shuffle is a stable permutation", () => {
  const a = shuffledOrder(100, 42), b = shuffledOrder(100, 42), c = shuffledOrder(100, 43);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  assert.deepEqual([...a].sort((x, y) => x - y), Array.from({ length: 100 }, (_, i) => i));
});
test("52 weeks: totals", () => {
  assert.equal(sum(weekAmounts("classic", 100)), 137800);
  assert.equal(sum(weekAmounts("reverse", 100)), 137800);
  assert.equal(weekAmounts("reverse", 100)[0], 5200);
  assert.equal(sum(weekAmounts("flat", 2000)), 104000);
  assert.equal(daysInMonth(2028, 2), 29);
});

test("store: jars, deposits, withdrawals and limits", () => {
  let st = S.emptyState();
  const { state: s1, jar } = S.addJar(st, { name: " Laptop ", target: 500000 });
  assert.equal(jar.name, "Laptop");
  let { state: s2 } = S.addEntry(s1, jar.id, 120000, "birthday");
  ({ state: s2 } = S.addEntry(s2, jar.id, -20000));
  assert.equal(S.balance(s2.jars[0]), 100000);
  assert.equal(S.progress(s2.jars[0]), 0.2);
  assert.throws(() => S.addEntry(s2, jar.id, -100001));
  assert.throws(() => S.addEntry(s2, jar.id, 0));
  assert.throws(() => S.addJar(st, { name: "", target: 100 }));
  assert.equal(s1.jars[0].entries.length, 0, "earlier state is not mutated");
  const { state: s3 } = S.addJar(s2, { name: "Trip", target: 100 });
  assert.equal(S.canAddJar(s3), false);
  s3.license = { key: "x", status: "active" };
  assert.equal(S.canAddJar(s3), true);
  assert.deepEqual(S.crossed(0.2, 0.8), [0.25, 0.5, 0.75]);
  assert.deepEqual(S.crossed(0.5, 0.6), []);
});
test("store: challenge steps deposit and undo cleanly", () => {
  const { state: a, jar } = S.addJar(S.emptyState(), { name: "Fund", target: 505000 });
  const { state: b, challenge } = S.addChallenge(a, { type: "envelopes", jarId: jar.id, config: { count: 100, target: 505000, seed: 7 } });
  const r1 = S.toggleStep(b, challenge.id, 9);
  assert.equal(r1.change, 1000);
  assert.equal(S.balance(r1.state.jars[0]), 1000);
  assert.equal(challengeProgress(r1.state.challenges[0]).doneCount, 1);
  const r2 = S.toggleStep(r1.state, challenge.id, 9);
  assert.equal(r2.change, -1000);
  assert.equal(S.balance(r2.state.jars[0]), 0);
  assert.equal(Object.keys(r2.state.challenges[0].done).length, 0);
  // deleting the deposit from the jar history also un-ticks the envelope
  const r3 = S.toggleStep(b, challenge.id, 4);
  const s4 = S.removeEntry(r3.state, jar.id, r3.state.jars[0].entries[0].id);
  assert.equal(Object.keys(s4.challenges[0].done).length, 0);
  // zero-amount steps (no-spend day with nothing banked) tick without a deposit and without mutating the input
  const { state: c, challenge: ns } = S.addChallenge(a, { type: "nospend", jarId: jar.id, config: { year: 2026, month: 11, perDay: 0 } });
  const t1 = S.toggleStep(c, ns.id, 0);
  assert.equal(t1.state.challenges[0].done[0], "none");
  const t2 = S.toggleStep(t1.state, ns.id, 0);
  assert.equal(Object.keys(t2.state.challenges[0].done).length, 0);
  assert.equal(t1.state.challenges[0].done[0], "none");
});
test("store: split shares add up and never exceed the amount", () => {
  const parts = S.splitAmount(100001, [{ jarId: "a", pct: 50 }, { jarId: "b", pct: 30 }, { jarId: "c", pct: 0 }]);
  assert.equal(parts.length, 2);
  assert.equal(sum(parts.map((p) => p.amt)), Math.floor(100001 * 0.8));
  assert.deepEqual(S.splitAmount(1000, [{ jarId: "a", pct: 70 }, { jarId: "b", pct: 40 }]), []);
});
test("store: streak and weekly need", () => {
  const { state: a, jar } = S.addJar(S.emptyState(), { name: "X", target: 100000, deadline: "2026-12-31" });
  const at = new Date("2026-11-18T12:00:00").getTime();
  a.jars[0].entries = [0, 7, 14].map((d, i) => ({ id: `e${i}`, t: at - d * 864e5, amt: 1000, note: "" }));
  assert.equal(S.weekStreak(a, at), 3);
  assert.equal(S.weekStreak(a, at + 7 * 864e5), 3, "still counts if this week has no deposit yet");
  assert.equal(S.weekStreak(a, at + 14 * 864e5), 0);
  const need = S.weeklyNeed(a.jars[0], at);
  assert.equal(need.weeks, 7);
  assert.equal(need.perWeek, Math.ceil(97000 / 7));
  assert.equal(jar.deadline, "2026-12-31");
});
test("store: import rejects junk and strips unknown or unsafe fields", () => {
  assert.equal(S.importData("not json"), null);
  assert.equal(S.importData(JSON.stringify({ v: 1 })), null);
  const dirty = { app: "brimful", v: 1, settings: { currency: "<script>", theme: "neon" }, evil: true,
    jars: [{ id: "j1", name: "Ok", target: 1000, style: "x", entries: [{ id: "e", t: 1, amt: 5 }, { id: "bad", t: 1, amt: "9" }] }, { id: "j2", name: "", target: 5 }],
    challenges: [{ id: "c", type: "envelopes", jarId: "nope", config: { count: 100, target: 505000, seed: 1 } }], license: { key: "abc", status: "active" } };
  const clean = S.importData(JSON.stringify(dirty));
  assert.equal(clean.settings.currency, "USD");
  assert.equal(clean.settings.theme, "system");
  assert.equal(clean.jars.length, 1);
  assert.equal(clean.jars[0].style, "brass");
  assert.equal(clean.jars[0].entries.length, 1);
  assert.equal(clean.challenges.length, 0);
  assert.equal(clean.license, null);
  assert.equal(clean.evil, undefined);
  const round = S.importData(S.exportData(clean));
  assert.deepEqual(round, clean);
});
