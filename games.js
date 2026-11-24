// Генератори міні-ігор (19 ігор).
// Кожен генератор повертає «раунд»: {autoClock, isReady(), keys(), init(api), render(), tap(v, api)}
"use strict";
const COLORS = [["🔴", "red", "#ff4d4d"], ["🟢", "green", "#3ddc84"], ["🔵", "blue", "#4d8dff"],
  ["🟡", "yellow", "#ffd33d"], ["🟣", "purple", "#b56bff"], ["🟠", "orange", "#ff9a3d"]];
const DIRS = [["⬅️", "left"], ["⬆️", "up"], ["⬇️", "down"], ["➡️", "right"]];
const OBJECTS = ["🐱", "🐶", "🐭", "🐰", "🦊", "🐻", "🐼", "🐸", "🐵", "🦁", "🐯", "🐮"];
const GROUPS = [["🍎", "🍌", "🍇", "🍓", "🍒", "🍊"], ["🐱", "🐶", "🐭", "🐰", "🦊", "🐻"],
  ["🚗", "🚌", "🚲", "✈️", "🚂", "🚢"], ["⚽", "🏀", "🏈", "🎾", "🏐", "🏉"]];
const ALL_EMO = [].concat(...GROUPS);
const SHAPES = ["🔺", "🔵", "🟩", "⭐", "🔶", "⬛", "🟣", "❤️"];

const gridHtml = (cols, cells, cls = "cell") =>
  `<div class="grid" style="grid-template-columns:repeat(${cols},1fr)">` +
  cells.map(c => `<button class="btn ${cls} ${c.cls || ""}" ${c.style ? `style="${c.style}"` : ""} data-act="tap" data-v="${c.v}">${c.label}</button>`).join("") + `</div>`;

// Раунд із варіантами відповіді
function optionsRound(o) {
  return {
    autoClock: o.autoClock !== false,
    isReady: () => (o.ready ? o.ready() : true),
    keys: () => [o.answer],
    init: o.init || null,
    render() {
      let h = o.pre ? o.pre() : `<div class="q${o.small ? " sm" : ""}">${o.text}</div>`;
      if (o.showOptions && !o.showOptions()) return h;
      h += `<div class="grid" style="grid-template-columns:repeat(${o.cols || 2},1fr)">`;
      o.options.forEach((x, i) => {
        let cls = "";
        if (S.mark) { if (i === o.answer) cls = "ok"; else if (i === S.mark.chosen) cls = "bad"; }
        h += `<button class="btn opt ${cls}" data-act="tap" data-v="${i}">${o.html ? x : esc(x)}</button>`;
      });
      return h + `</div>`;
    },
    tap(v, api) {
      if (o.ready && !o.ready()) return;
      const i = Number(v);
      S.mark = {chosen: i};
      api.finish(i === o.answer);
    }
  };
}
// унікальні варіанти відповіді-числа навколо правильної
function numOptions(ans, spread) {
  const opts = new Set([ans]);
  let guard = 0;
  while (opts.size < 4 && guard++ < 200) { const d = (rng() < 0.5 ? -1 : 1) * rnd(1, spread); if (ans + d >= 0) opts.add(ans + d); }
  while (opts.size < 4) opts.add(ans + opts.size + 10);
  return shuffle([...opts]);
}

/* ---------- МАТЕМАТИКА ---------- */
function mkMath(s) {
  const L = s.lvl, op = pick(L < 2 ? ["+", "-"] : ["+", "-", "*", "/"]);
  let a, b, ans, sym;
  if (op === "+") { a = rnd(2, 8 + 5 * L); b = rnd(2, 8 + 5 * L); ans = a + b; sym = "+"; }
  else if (op === "-") { a = rnd(5, 10 + 6 * L); b = rnd(2, 5 + 4 * L); if (b > a) [a, b] = [b, a]; ans = a - b; sym = "−"; }
  else if (op === "*") { const m = 3 + 2 * L; a = rnd(2, m); b = rnd(2, m); ans = a * b; sym = "×"; }
  else { const m = 3 + 2 * L; b = rnd(2, m); ans = rnd(2, m); a = b * ans; sym = "÷"; }
  const options = numOptions(ans, 10);
  return optionsRound({text: `${a} ${sym} ${b} = ?`, options: options.map(String), answer: options.indexOf(ans), cols: 2});
}

function genExpr(L) {
  const op = L < 3 ? pick(["+", "-"]) : pick(["+", "-", "*"]);
  let a, b, v;
  if (op === "+") { a = rnd(2, 6 + 5 * L); b = rnd(2, 6 + 5 * L); v = a + b; }
  else if (op === "-") { a = rnd(5, 10 + 6 * L); b = rnd(1, a - 1); v = a - b; }
  else { a = rnd(2, 4 + L); b = rnd(2, 4 + L); v = a * b; }
  return {s: `${a} ${op === "-" ? "−" : op === "*" ? "×" : "+"} ${b}`, v};
}
function mkCompare(s) {
  const A = genExpr(s.lvl);
  let B = genExpr(s.lvl), tries = 0;
  if (rng() < 0.25) { while ((B.v !== A.v || B.s === A.s) && tries++ < 300) B = genExpr(s.lvl); }
  else { while (B.v === A.v && tries++ < 50) B = genExpr(s.lvl); }
  const ans = A.v > B.v ? 0 : A.v < B.v ? 2 : 1;
  return optionsRound({text: esc(t("p_compare")), options: [A.s, "=", B.s], answer: ans, cols: 3, small: true});
}

function mkMissing(s) {
  const L = s.lvl, form = pick(L < 2 ? ["a+x", "x+b"] : ["a+x", "a-x", "a*x", "x+b"]);
  let x, text;
  if (form === "a+x") { const a = rnd(2, 8 + 6 * L); x = rnd(2, 8 + 6 * L); text = `${a} + ? = ${a + x}`; }
  else if (form === "x+b") { const b = rnd(2, 8 + 6 * L); x = rnd(2, 8 + 6 * L); text = `? + ${b} = ${x + b}`; }
  else if (form === "a-x") { x = rnd(2, 6 + 5 * L); const a = x + rnd(2, 6 + 5 * L); text = `${a} − ? = ${a - x}`; }
  else { const a = rnd(2, 4 + L); x = rnd(2, 4 + L); text = `${a} × ? = ${a * x}`; }
  const options = numOptions(x, 6);
  return optionsRound({text, options: options.map(String), answer: options.indexOf(x), cols: 2});
}

function mkChain(s) {
  const L = s.lvl, n = 2 + Math.ceil(L / 2);
  let v = rnd(2, 8 + 3 * L), text = String(v);
  for (let i = 0; i < n; i++) {
    const minus = v > 3 && rng() < 0.5;
    if (minus) { const st = rnd(1, Math.min(6 + 2 * L, v)); v -= st; text += ` − ${st}`; }
    else { const st = rnd(1, 6 + 2 * L); v += st; text += ` + ${st}`; }
  }
  const options = numOptions(v, 8);
  return optionsRound({text: `${text} = ?`, options: options.map(String), answer: options.indexOf(v), cols: 2, small: true});
}

/* ---------- ПАМ'ЯТЬ ---------- */
function mkMemory(s) {
  const k = Math.min(2 + s.lvl, 7);
  const cells = sample([0, 1, 2, 3, 4, 5, 6, 7, 8], k);
  const nums = shuffle(Array.from({length: k}, (_, i) => i + 1));
  const map = {}, inv = {};
  cells.forEach((c, i) => { map[c] = nums[i]; inv[nums[i]] = c; });
  let phase = "show", nxt = 1;
  const found = new Set();
  return {
    autoClock: false,
    isReady: () => phase === "play",
    keys: () => Array.from({length: k}, (_, i) => inv[i + 1]),
    init(api) { api.later(() => { phase = "play"; api.startClock(); api.draw(); }, 1000 + 500 * k); },
    render() {
      const hint = phase === "show" ? t("mem_show", {k}) : t("mem_play", {k, found: found.size});
      const cs = [];
      for (let i = 0; i < 9; i++) {
        let label = "▫️", cls = "";
        if (phase === "show") { if (map[i] !== undefined) label = map[i]; }
        else if (found.has(i)) { label = map[i]; cls = "found"; }
        else { label = "?"; if (S.mark && S.mark.bad === i) cls = "bad"; }
        cs.push({label, cls, v: i});
      }
      return `<div class="hint">${esc(hint)}</div>` + gridHtml(3, cs);
    },
    tap(v, api) {
      if (phase !== "play") return;
      const i = Number(v);
      if (found.has(i)) return;
      if (map[i] === nxt) {
        found.add(i); nxt++;
        if (nxt > k) api.finish(true); else { Snd.sfx("tick"); api.draw(); }
      } else { S.mark = {bad: i}; api.finish(false); }
    }
  };
}

function mkSimon(s) {
  const k = Math.min(2 + s.lvl, 7);
  const seq = Array.from({length: k}, () => rnd(0, 3));
  const NOTES = [262, 330, 392, 523], COLS = ["#ff4d4d", "#3ddc84", "#4d8dff", "#ffd33d"];
  let phase = "watch", lit = -1, pos = 0;
  return {
    autoClock: false,
    isReady: () => phase === "input",
    keys: () => seq.slice(),
    init(api) {
      seq.forEach((c, i) => {
        api.later(() => { lit = c; Snd.beep(NOTES[c], 0.3); api.draw(); }, 700 + i * 800);
        api.later(() => { lit = -1; api.draw(); }, 700 + i * 800 + 500);
      });
      api.later(() => { phase = "input"; api.startClock(); api.draw(); }, 700 + k * 800);
    },
    render() {
      const hint = phase === "watch" ? t("p_simon_watch") : t("p_simon_repeat", {n: pos, k});
      const cells = COLS.map((c, i) => ({
        label: "&nbsp;", v: i, cls: (lit === i ? "lit" : ""),
        style: `background:${c};opacity:${lit === i || phase === "input" ? 1 : 0.5}`
      }));
      return `<div class="hint">${esc(hint)}</div>` + gridHtml(2, cells, "simon");
    },
    tap(v, api) {
      if (phase !== "input") return;
      const c = Number(v);
      Snd.beep(NOTES[c], 0.2);
      if (c === seq[pos]) { pos++; if (pos >= k) api.finish(true); else api.draw(); }
      else api.finish(false);
    }
  };
}

function mkVanish(s) {
  const n = 3 + s.lvl, pool = shuffle(ALL_EMO.slice());
  const items = pool.slice(0, n), gone = items[rnd(0, n - 1)];
  const rest = shuffle(items.filter(x => x !== gone));
  const options = shuffle([gone, ...pool.slice(n, n + 3)]);
  let phase = "show";
  return optionsRound({
    autoClock: false, options, answer: options.indexOf(gone), cols: 4, html: false,
    ready: () => phase === "ask", showOptions: () => phase === "ask",
    init(api) { api.later(() => { phase = "ask"; api.startClock(); api.draw(); }, 1200 + 400 * n); },
    pre: () => phase === "show"
      ? `<div class="hint">${esc(t("p_vanish_show"))}</div><div class="emo">${items.join(" ")}</div>`
      : `<div class="hint">${esc(t("p_vanish_ask"))}</div><div class="emo">${rest.join(" ")}</div>`
  });
}

function mkDigits(s) {
  const len = 3 + s.lvl;
  let num = String(rnd(1, 9));
  while (num.length < len) num += rnd(0, 9);
  const variants = new Set([num]);
  let guard = 0;
  while (variants.size < 4 && guard++ < 200) {
    const d = num.split("");
    const i = rnd(0, len - 1);
    if (rng() < 0.5 && i < len - 1 && d[i] !== d[i + 1]) { [d[i], d[i + 1]] = [d[i + 1], d[i]]; }
    else { let nd; do { nd = String(rnd(0, 9)); } while (nd === d[i]); d[i] = nd; }
    if (d[0] !== "0") variants.add(d.join(""));
  }
  const options = shuffle([...variants]);
  let phase = "show";
  return optionsRound({
    autoClock: false, options, answer: options.indexOf(num), cols: 2,
    ready: () => phase === "ask", showOptions: () => phase === "ask",
    init(api) { api.later(() => { phase = "ask"; api.startClock(); api.draw(); }, 800 + 450 * len); },
    pre: () => phase === "show"
      ? `<div class="hint">${esc(t("p_digits_show"))}</div><div class="q big">${num}</div>`
      : `<div class="q sm">${esc(t("p_digits_ask"))}</div>`
  });
}


// «Вікна хмарочоса»: запам'ятай, у яких вікнах горіло жовте світло
function mkTower(s) {
  const L = s.lvl, cols = [3, 3, 4, 4, 5][L - 1], rows = [4, 5, 5, 6, 7][L - 1], k = 2 + L;
  const lit = new Set(sample(Array.from({length: cols * rows}, (_, i) => i), k));
  const found = new Set();
  let phase = "show";
  return {
    autoClock: false,
    isReady: () => phase === "play",
    keys: () => [...lit],
    init(api) { api.later(() => { phase = "play"; api.startClock(); api.draw(); }, 1200 + 450 * k); },
    render() {
      const hint = phase === "show" ? t("p_tower_show") : t("p_tower_play", {n: found.size, k});
      const cells = Array.from({length: cols * rows}, (_, i) => {
        let cls = "";
        if (phase === "show") cls = lit.has(i) ? "lit" : "";
        else if (found.has(i)) cls = "lit";
        else if (S.mark && S.mark.bad === i) cls = "bad";
        else if (S.locked && lit.has(i)) cls = "miss";   // показати пропущені вікна
        return {label: "&nbsp;", v: i, cls};
      });
      return `<div class="hint">${esc(hint)}</div><div class="tower"><div class="antenna"></div>` +
        gridHtml(cols, cells, "win") + `<div class="door"></div></div>`;
    },
    tap(v, api) {
      if (phase !== "play") return;
      const i = Number(v);
      if (found.has(i)) return;
      if (lit.has(i)) {
        found.add(i);
        if (found.size >= k) api.finish(true); else { Snd.sfx("tick"); api.draw(); }
      } else { S.mark = {bad: i}; api.finish(false); }
    }
  };
}

/* ---------- ЛОГІКА ---------- */
function numSeq(level) {
  const kinds = ["arith", "geo"];
  if (level >= 1) kinds.push("square", "grow");
  if (level >= 2) kinds.push("fib", "alt");
  const kind = pick(kinds);
  let seq;
  if (kind === "arith") { const d = pick([2, 3, 4, 5, 6, 7, -2, -3]), a = d > 0 ? rnd(1, 20) : rnd(20, 40); seq = [0, 1, 2, 3, 4, 5].map(i => a + d * i); }
  else if (kind === "geo") { const a = rnd(1, 4), r = pick([2, 3]); seq = [0, 1, 2, 3, 4].map(i => a * Math.pow(r, i)); }
  else if (kind === "square") { const n = rnd(1, 8); seq = [0, 1, 2, 3, 4].map(i => (n + i) * (n + i)); }
  else if (kind === "grow") { const st = rnd(1, 3); seq = [rnd(1, 10)]; for (let i = 0; i < 5; i++) seq.push(seq[seq.length - 1] + st + i); }
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
    return optionsRound({text: `${esc(t("logic_shape"))}<br>${seq.join(" ")} ❓`, options, answer: options.indexOf(ans), cols: 2, small: true});
  }
  const [shown, ans] = numSeq(Math.min(s.lvl - 1, 2));
  const options = numOptions(ans, 6);
  return optionsRound({text: `${esc(t("logic_seq"))}<br>${shown.join(", ")}, ?`, options: options.map(String), answer: options.indexOf(ans), cols: 2, small: true});
}

function mkOdd() {
  const gi = rnd(0, GROUPS.length - 1);
  let gj; do { gj = rnd(0, GROUPS.length - 1); } while (gj === gi);
  const odd = pick(GROUPS[gj]), options = shuffle(sample(GROUPS[gi], 3).concat([odd]));
  return optionsRound({text: esc(t("p_odd")), options, answer: options.indexOf(odd), cols: 2, small: true});
}

function mkMultiples(s) {
  const pool = s.lvl <= 1 ? [2, 5, 10] : s.lvl === 2 ? [2, 3, 4, 5] : s.lvl === 3 ? [3, 4, 5, 6, 7] : [4, 6, 7, 8, 9];
  const n = pick(pool), ans = n * rnd(2, 5 + 2 * s.lvl), set = new Set([ans]);
  let guard = 0;
  while (set.size < 4 && guard++ < 500) { const x = rnd(5, 20 + 10 * s.lvl); if (x % n !== 0) set.add(x); }
  while (set.size < 4) set.add(ans + set.size);   // запасний варіант
  const options = shuffle([...set]);
  return optionsRound({text: esc(t("p_multiples", {n})), options: options.map(String), answer: options.indexOf(ans), cols: 2, small: true});
}

function mkExtreme(s) {
  const set = new Set(), max = 30 + 25 * s.lvl;
  while (set.size < 4) set.add(rnd(5, max));
  const nums = shuffle([...set]), isMax = rng() < 0.5;
  const target = isMax ? Math.max(...nums) : Math.min(...nums);
  return optionsRound({text: esc(t(isMax ? "p_max" : "p_min")), options: nums.map(String), answer: nums.indexOf(target), cols: 2, small: true});
}

/* ---------- УВАГА ---------- */
function mkStroop(s) {
  const word = pick(COLORS);
  let ink = pick(COLORS);
  if (s.lvl >= 2) { while (ink === word) ink = pick(COLORS); }
  const opts = shuffle(sample(COLORS.filter(c => c !== ink), 3).concat([ink]));
  return optionsRound({
    text: `${esc(t("p_stroop"))}<br><span style="color:${ink[2]};font-size:44px">${esc(t("color_" + word[1]).toUpperCase())}</span>`,
    options: opts.map(c => c[0]), answer: opts.indexOf(ink), cols: 2, small: true
  });
}

function mkDiff(s) {
  const n = s.lvl <= 2 ? 3 : s.lvl <= 4 ? 4 : 5;
  const pair = pick([["😀", "😃"], ["🍎", "🍅"], ["🌕", "🌖"], ["🔴", "🟠"], ["🐶", "🐺"], ["🕐", "🕑"], ["🙂", "🙃"]]);
  const flip = rng() < 0.5, base = flip ? pair[1] : pair[0], other = flip ? pair[0] : pair[1];
  const idx = rnd(0, n * n - 1);
  return {
    autoClock: true,
    isReady: () => true,
    keys: () => [idx],
    render() {
      const cells = Array.from({length: n * n}, (_, i) => {
        let cls = "";
        if (S.mark) { if (i === idx) cls = "found"; else if (i === S.mark.bad) cls = "bad"; }
        return {label: i === idx ? other : base, cls, v: i, style: `font-size:${n >= 5 ? 24 : n === 4 ? 30 : 38}px`};
      });
      return `<div class="hint">${esc(t("p_diff"))}</div>` + gridHtml(n, cells);
    },
    tap(v, api) { const i = Number(v); if (i !== idx) S.mark = {bad: i}; else S.mark = {}; api.finish(i === idx); }
  };
}

function mkCount(s) {
  const types = sample(ALL_EMO, 3), target = types[0];
  const c = rnd(3, 5 + s.lvl), total = 8 + 2 * s.lvl;
  const items = Array.from({length: c}, () => target);
  while (items.length < total) items.push(types[rnd(1, 2)]);
  shuffle(items);
  const options = numOptions(c, 3);
  return optionsRound({
    options: options.map(String), answer: options.indexOf(c), cols: 4,
    pre: () => `<div class="q sm">${esc(t("p_count", {target}))}</div><div class="emo">${items.join(" ")}</div>`
  });
}

function mkSchulte(s) {
  const k = Math.min(4 + s.lvl, 9);
  const cells = sample([0, 1, 2, 3, 4, 5, 6, 7, 8], k);
  const nums = shuffle(Array.from({length: k}, (_, i) => i + 1));
  const map = {}, inv = {};
  cells.forEach((c, i) => { map[c] = nums[i]; inv[nums[i]] = c; });
  let nxt = 1;
  const found = new Set();
  return {
    autoClock: true,
    isReady: () => true,
    keys: () => Array.from({length: k}, (_, i) => inv[i + 1]),
    render() {
      const cs = [];
      for (let i = 0; i < 9; i++) {
        if (map[i] === undefined) { cs.push({label: "▫️", v: i, cls: "dim"}); continue; }
        cs.push({label: found.has(i) ? "✔" : map[i], v: i, cls: found.has(i) ? "found" : (S.mark && S.mark.bad === i ? "bad" : "")});
      }
      return `<div class="hint">${esc(t("p_schulte", {k}))}</div>` + gridHtml(3, cs);
    },
    tap(v, api) {
      const i = Number(v);
      if (map[i] === undefined || found.has(i)) return;
      if (map[i] === nxt) {
        found.add(i); nxt++;
        if (nxt > k) api.finish(true); else { Snd.sfx("tick"); api.draw(); }
      } else { S.mark = {bad: i}; api.finish(false); }
    }
  };
}

/* ---------- РЕАКЦІЯ ---------- */
function mkReflex() {
  const kind = pick(["color", "dir", "find"]);
  if (kind === "color") {
    const opts = sample(COLORS, 4), c = pick(opts);
    return optionsRound({text: t("reflex_color", {name: "<b>" + esc(t("color_" + c[1])) + "</b>"}), options: opts.map(o => o[0]), answer: opts.indexOf(c), cols: 2, small: true, html: true});
  }
  if (kind === "dir") {
    const opts = sample(DIRS, 4), d = pick(opts);
    return optionsRound({text: t("reflex_dir", {name: "<b>" + esc(t("dir_" + d[1])) + "</b>"}), options: opts.map(o => o[0]), answer: opts.indexOf(d), cols: 2, small: true, html: true});
  }
  const labels = sample(OBJECTS, 6), ans = pick(labels);
  return optionsRound({text: esc(t("reflex_find", {target: ans})), options: labels, answer: labels.indexOf(ans), cols: 3, small: true});
}

function mkTarget() {
  let phase = "wait", pos = -1;
  return {
    autoClock: false,
    isReady: () => phase === "go",
    keys: () => [pos],
    init(api) {
      api.later(() => { phase = "go"; pos = rnd(0, 8); api.startClock(); api.draw(); }, rnd(900, 2400));
    },
    render() {
      const cells = Array.from({length: 9}, (_, i) => ({
        label: phase === "go" && i === pos ? "🎯" : "⬜", v: i,
        cls: S.mark && S.mark.bad === i ? "bad" : (phase === "go" && i === pos && S.locked ? "found" : "")
      }));
      return `<div class="hint">${esc(t(phase === "go" ? "p_target_go" : "p_target_wait"))}</div>` + gridHtml(3, cells);
    },
    tap(v, api) {
      const i = Number(v);
      if (phase === "wait") { S.mark = {bad: i}; api.finish(false, "early"); return; }
      if (i !== pos) S.mark = {bad: i};
      api.finish(i === pos);
    }
  };
}

function mkOpposite(s) {
  const [em, name] = pick([["⬅️", "left"], ["➡️", "right"]]);
  const same = s.lvl < 2 ? true : rng() < 0.5;
  const order = ["left", "right"], opts = ["⬅️", "➡️"];
  const ansName = same ? name : (name === "left" ? "right" : "left");
  return optionsRound({
    text: `<div class="q big">${em}</div><div class="hint">${esc(t(same ? "p_same" : "p_opp"))}</div>`,
    options: opts, answer: order.indexOf(ansName), cols: 2
  });
}

const MAKERS = {
  math: mkMath, compare: mkCompare, missing: mkMissing, chain: mkChain,
  memory: mkMemory, simon: mkSimon, vanish: mkVanish, digits: mkDigits, tower: mkTower,
  logic: mkLogic, odd: mkOdd, multiples: mkMultiples, extreme: mkExtreme,
  stroop: mkStroop, diff: mkDiff, count: mkCount, schulte: mkSchulte,
  reflex: mkReflex, target: mkTarget, opposite: mkOpposite
};
