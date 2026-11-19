// Звуки: короткі «бипи» в ретро-стилі кнопкових телефонів + затишна фонова мелодія (все синтезується, файлів немає)
"use strict";
const Snd = (() => {
  let ctx = null, master = null, mus = null, loopTimer = null, playing = false, unlocked = false;
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  const sfxOn = () => !P || P.sound !== false;
  const musOn = () => !P || P.music !== false;

  function ensure() {
    if (!ctx) {
      try {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return false;
        ctx = new C();
        master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
      } catch (e) { ctx = null; return false; }
    }
    if (ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
    return true;
  }

  function tone(f, t0, dur, type, vol, dest) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  // [частота, затримка, тривалість]
  const SFX = {
    click: [[880, 0, .05]],
    tick: [[1250, 0, .04]],
    ok: [[784, 0, .09], [1047, .09, .16]],
    bad: [[220, 0, .15], [165, .15, .25]],
    win: [[523, 0, .12], [659, .12, .12], [784, .24, .12], [1047, .36, .35]],
    fanfare: [[523, 0, .1], [659, .1, .1], [784, .2, .1], [1047, .3, .16], [784, .46, .1], [1047, .56, .1], [1319, .66, .45]]
  };

  function sfx(name) {
    if (!sfxOn() || !ensure() || !SFX[name]) return;
    const t0 = ctx.currentTime;
    SFX[name].forEach(([f, d, du]) => tone(f, t0 + d, du, "square", 0.09));
  }
  function beep(f, dur) {
    if (!sfxOn() || !ensure()) return;
    tone(f, ctx.currentTime, dur || 0.25, "square", 0.09);
  }

  // Мелодія: C Am F G, повільно й м'яко
  const BEAT = 0.78;
  const BARS = [
    [[64, 1], [67, 1], [72, 1], [67, 1]], [[69, 2], [67, 1], [64, 1]],
    [[69, 1], [72, 1], [69, 1], [64, 1]], [[67, 2], [62, 1], [64, 1]],
    [[64, 1], [67, 1], [64, 1], [60, 1]], [[64, 2], [69, 2]],
    [[72, 1], [69, 1], [67, 1], [64, 1]], [[62, 2], [67, 2]]
  ];
  const BASS = [48, 45, 41, 43, 48, 45, 41, 43];

  function phrase() {
    if (!playing || !ctx) return;
    const t0 = ctx.currentTime + 0.1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(1, t0 + 1.2);
    g.connect(master);
    mus = g;
    BARS.forEach((bar, bi) => {
      let beat = bi * 4;
      bar.forEach(([n, b]) => { tone(midi(n), t0 + beat * BEAT, b * BEAT * 0.95, "triangle", 0.07, g); beat += b; });
      tone(midi(BASS[bi]), t0 + bi * 4 * BEAT, 2 * BEAT, "sine", 0.1, g);
      tone(midi(BASS[bi] + 7), t0 + (bi * 4 + 2) * BEAT, 2 * BEAT, "sine", 0.07, g);
    });
    loopTimer = setTimeout(phrase, (BARS.length * 4 * BEAT - 0.2) * 1000);
  }
  function startMusic() {
    if (playing || !unlocked || !musOn() || !ensure()) return;
    playing = true; phrase();
  }
  function stopMusic() {
    playing = false;
    clearTimeout(loopTimer);
    if (mus && ctx) {
      const g = mus; mus = null;
      try { g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setValueAtTime(g.gain.value, ctx.currentTime); g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4); } catch (e) {}
      setTimeout(() => { try { g.disconnect(); } catch (e) {} }, 600);
    }
  }
  function unlock() {   // викликається при першому дотику (браузер дозволяє звук лише після нього)
    if (!unlocked) { unlocked = true; ensure(); }
    startMusic();
  }
  function refresh() { if (musOn()) startMusic(); else stopMusic(); }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopMusic(); else if (unlocked) startMusic();
  });
  return {sfx, beep, unlock, refresh};
})();
