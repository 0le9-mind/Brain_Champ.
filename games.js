// Генератори міні-ігор
"use strict";
/* ===== Генератори раундів ===== */
const COLORS = [["🔴", "red"], ["🟢", "green"], ["🔵", "blue"], ["🟡", "yellow"], ["🟣", "purple"], ["🟠", "orange"]];
const DIRS = [["⬅️", "left"], ["⬆️", "up"], ["⬇️", "down"], ["➡️", "right"]];
const OBJECTS = ["🐱", "🐶", "🐭", "🐰", "🦊", "🐻", "🐼", "🐸", "🐵", "🦁", "🐯", "🐮"];
const SHAPES = ["🔺", "🔵", "🟩", "⭐", "🔶", "⬛", "🟣", "❤️"];

function optionsRound(text, options, answerIdx, cols, small) {
  return {kind: "options", text: `<div class="q${small ? " sm" : ""}">${text}</div>`, options, answer: answerIdx, cols};
}

function mkMath(s) {
  const level = 1 + Math.floor((s.round - 1) / 3);
  const op = pick(["+", "-", "*", "/"]);
  let a, b, ans, sym;
  if (op === "+") { a = rnd(2, 10 * level + 10); b = rnd(2, 10 * level + 10); ans = a + b; sym = "+"; }
  else if (op === "-") { a = rnd(5, 10 * level + 15); b = rnd(2, 10 * level + 5); if (b > a) [a, b] = [b, a]; ans = a - b; sym = "−"; }
  else if (op === "*") { const m = 4 + 2 * level; a = rnd(2, m); b = rnd(2, m); ans = a * b; sym = "×"; }
  else { const m = 4 + 2 * level; b = rnd(2, m); ans = rnd(2, m); a = b * ans; sym = "÷"; }
  const opts = new Set([ans]);
  while (opts.size < 4) { const d = (Math.random() < 0.5 ? -1 : 1) * rnd(1, 10); if (ans + d >= 0) opts.add(ans + d); }
  const options = shuffle([...opts]);
  return optionsRound(`${a} ${sym} ${b} = ?`, options.map(String), options.indexOf(ans), 2);
}

function mkMemory(s) {
  const k = Math.min(3 + Math.floor((s.round - 1) / 3), 7);
  const cells = sample([0, 1, 2, 3, 4, 5, 6, 7, 8], k);
  const nums = shuffle(Array.from({length: k}, (_, i) => i + 1));
  const map = {};
  cells.forEach((c, i) => { map[c] = nums[i]; });
  return {kind: "grid", map, k, next: 1, found: new Set(), phase: "show"};
}

function mkReflex() {
  const kind = pick(["color", "dir", "find"]);
  if (kind === "color") {
    const opts = sample(COLORS, 4), [emoji, name] = pick(opts);
    return optionsRound(t("reflex_color", {name: "<b>" + t("color_" + name) + "</b>"}), opts.map(o => o[0]), opts.findIndex(o => o[0] === emoji), 2, true);
  }
  if (kind === "dir") {
    const opts = sample(DIRS, 4), [emoji, name] = pick(opts);
    return optionsRound(t("reflex_dir", {name: "<b>" + t("dir_" + name) + "</b>"}), opts.map(o => o[0]), opts.findIndex(o => o[0] === emoji), 2, true);
  }
  const labels = sample(OBJECTS, 6), ans = pick(labels);
  return optionsRound(t("reflex_find", {target: ans}), labels, labels.indexOf(ans), 3, true);
}

function numSeq(level) {
  const kinds = ["arith", "geo"];
  if (level >= 1) kinds.push("square", "grow");
  if (level >= 2) kinds.push("fib", "alt");
  const kind = pick(kinds);
  let seq;
  if (kind === "arith") { const d = pick([2, 3, 4, 5, 6, 7, -2, -3]), a = d > 0 ? rnd(1, 20) : rnd(20, 40); seq = [0, 1, 2, 3, 4, 5].map(i => a + d * i); }
  else if (kind === "geo") { const a = rnd(1, 4), r = pick([2, 3]); seq = [0, 1, 2, 3, 4].map(i => a * Math.pow(r, i)); }
  else if (kind === "square") { const n = rnd(1, 8); seq = [0, 1, 2, 3, 4].map(i => (n + i) * (n + i)); }
  else if (kind === "grow") { const step = rnd(1, 3); seq = [rnd(1, 10)]; for (let i = 0; i < 5; i++) seq.push(seq[seq.length - 1] + step + i); }
  else if (kind === "fib") { seq = [rnd(1, 5), rnd(1, 5)]; while (seq.length < 7) seq.push(seq[seq.length - 1] + seq[seq.length - 2]); }
  else { const a = rnd(1, 9), b = rnd(20, 40), d1 = rnd(1, 4), d2 = rnd(-4, -1); seq = [a, b, a + d1, b + d2, a + 2 * d1, b + 2 * d2]; }
  return [seq.slice(0, -1), seq[seq.length - 1]];
}

function mkLogic(s) {
  if (s.round % 3 === 0) {
    const n = rnd(2, 4), cycle = sample(SHAPES, n), shown = 2 * n + rnd(1, n - 1);
    const seq = Array.from({length: shown}, (_, i) => cycle[i % n]);
    const ans = cycle[shown % n];
    const options = shuffle(sample(SHAPES.filter(x => x !== ans), 3).concat([ans]));
    return optionsRound(`${esc(t("logic_shape"))}<br>${seq.join(" ")} ❓`, options, options.indexOf(ans), 2, true);
  }
  const level = Math.min(Math.floor((s.round - 1) / 4), 2);
  const [shown, ans] = numSeq(level);
  const opts = new Set([ans]);
  while (opts.size < 4) opts.add(ans + (Math.random() < 0.5 ? -1 : 1) * rnd(1, 6));
  const options = shuffle([...opts]);
  return optionsRound(`${esc(t("logic_seq"))}<br>${shown.join(", ")}, ?`, options.map(String), options.indexOf(ans), 2, true);
}

const MAKERS = {math: mkMath, memory: mkMemory, reflex: mkReflex, logic: mkLogic};


