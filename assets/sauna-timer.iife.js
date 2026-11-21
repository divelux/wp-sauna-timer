/*!
 * sauna-timer-element 1.0.0 — <sauna-timer> custom element
 * (c) 2026 DIVELUX Inc. MIT License. https://diveluxsaunahat.com
 *
 * A round timer for the sauna: time in the heat, a break, repeat, final
 * cool-down. No dependencies. Shadow DOM, so it does not fight your styles.
 *
 *   <sauna-timer rounds="3" heat="10" rest="10"></sauna-timer>
 *
 * Attributes
 *   rounds    number of rounds in the heat, 1-6 (default 3)
 *   heat      minutes per round, 1-35 (default 10)
 *   rest      minutes of break between rounds, 1-30 (default 10)
 *   cooldown  minutes of final cool-down, 1-30 (default: same as rest)
 *   muted     present = no beep (the checkbox in the timer can turn it back on)
 *   heading   optional title shown above the timer
 *   credit    "off" hides the small "Timer by DIVELUX" line
 *
 * The limits are bounds for a timer, not advice. General guidance is to keep
 * a single stay in a hot sauna to no more than 15-20 minutes. This element
 * does not know your sauna or your health. Not medical advice.
 */
/* Generated from sauna-timer.js by build.js. Do not edit. */
(function () {
'use strict';
const LIMITS = Object.freeze({
  rounds: Object.freeze({ min: 1, max: 6, def: 3 }),
  heat: Object.freeze({ min: 1, max: 35, def: 10 }),
  rest: Object.freeze({ min: 1, max: 30, def: 10 }),
  cooldown: Object.freeze({ min: 1, max: 30 })
});

function clampInt(value, range, fallback) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  if (!isFinite(n)) return fallback;
  return Math.min(range.max, Math.max(range.min, Math.round(n)));
}

/** Any input (attributes are strings, may be missing or junk) to a valid plan. */
function normalize(input) {
  const o = input || {};
  const rounds = clampInt(o.rounds, LIMITS.rounds, LIMITS.rounds.def);
  const heat = clampInt(o.heat, LIMITS.heat, LIMITS.heat.def);
  const rest = clampInt(o.rest, LIMITS.rest, LIMITS.rest.def);
  const cooldown = clampInt(o.cooldown, LIMITS.cooldown, rest);
  return { rounds, heat, rest, cooldown };
}

/**
 * The parts of a session, in order: heat, rest, heat, rest, ..., heat, cool.
 * Always ends with a cool-down. Each part: { kind, round, minutes, label }.
 */
function buildSegments(input) {
  const o = normalize(input);
  const out = [];
  for (let i = 1; i <= o.rounds; i++) {
    out.push({ kind: 'heat', round: i, minutes: o.heat, label: 'Round ' + i + ' of ' + o.rounds });
    if (i < o.rounds) out.push({ kind: 'rest', round: i, minutes: o.rest, label: 'Cool-down' });
  }
  out.push({ kind: 'cool', round: o.rounds, minutes: o.cooldown, label: 'Final cool-down' });
  return out;
}

/** Total length of the session in minutes. */
function totalMinutes(input) {
  return buildSegments(input).reduce((sum, s) => sum + s.minutes, 0);
}

/** 600000 ms to "10:00". Rounds up so the display hits 0:00 exactly at the end. */
function formatClock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

/** 75 to "1 h 15 min" */
function formatMinutes(min) {
  if (min < 60) return min + ' min';
  const h = Math.floor(min / 60), m = min % 60;
  return h + ' h' + (m ? ' ' + m + ' min' : '');
}

const TEMPLATE = `
<style>
  :host {
    --_bg: var(--sauna-timer-bg, #fffdf9);
    --_ink: var(--sauna-timer-ink, #1c110b);
    --_muted: var(--sauna-timer-muted, #66564b);
    --_line: var(--sauna-timer-line, #d9cfc1);
    --_accent: var(--sauna-timer-accent, #f0762e);
    --_accent-ink: var(--sauna-timer-accent-ink, #1c110b);
    --_heat: var(--sauna-timer-heat, #2a1b13);
    --_rest: var(--sauna-timer-rest, #e9dfd0);
    --_r: var(--sauna-timer-radius, 6px);
    --_display: var(--sauna-timer-display-font, var(--sauna-timer-font, inherit));
    display: block; container-type: inline-size; max-width: var(--sauna-timer-max-width, 560px);
    font-family: var(--sauna-timer-font, inherit); font-size: 16px; line-height: 1.5; color: var(--_ink); text-align: left;
  }
  :host([hidden]) { display: none; }
  *, *::before, *::after { box-sizing: border-box; }
  .card { background: var(--_bg); border: 1px solid var(--_line); border-radius: var(--_r); padding: 20px; }
  .title { margin: 0 0 8px; font-size: 14px; font-weight: 600; color: var(--_muted); }
  .phase { margin: 0; font-family: var(--_display); font-size: 20px; font-weight: 700; line-height: 1.2; }
  .clock { margin: 6px 0 6px -2px; font-family: var(--_display); font-weight: 700; font-size: clamp(64px, 24cqi, 112px); line-height: 1;
    letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
  .next { margin: 0; font-size: 15px; color: var(--_muted); min-height: 1.5em; }
  .bar { display: flex; gap: 2px; height: 12px; margin: 16px 0 0; padding: 0; list-style: none; }
  .bar li { flex: 1 1 0; min-width: 2px; border-radius: 2px; background: var(--_rest); position: relative; overflow: hidden; }
  .bar li.heat { background: #c9bcac; background: color-mix(in srgb, var(--_heat) 22%, var(--_rest)); }
  .bar li i { position: absolute; inset: 0 auto 0 0; width: 0; background: var(--_muted); }
  .bar li.heat i { background: var(--_heat); }
  .bar li.now { outline: 2px solid var(--_accent); outline-offset: 1px; }
  .btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 18px; }
  button { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: 10px 16px; margin: 0;
    border: 1px solid var(--_ink); border-radius: var(--_r); background: transparent; color: var(--_ink);
    font: inherit; font-family: var(--_display); font-weight: 700; line-height: 1.2; cursor: pointer; }
  button:hover { background: var(--_ink); color: var(--_bg); }
  button:active { transform: translateY(1px); }
  button:disabled { opacity: .45; cursor: default; }
  button:disabled:hover { background: transparent; color: var(--_ink); }
  button.go { grid-column: 1 / -1; background: var(--_accent); border-color: var(--_accent); color: var(--_accent-ink); }
  button.go:hover { filter: brightness(1.08); background: var(--_accent); color: var(--_accent-ink); }
  :focus-visible { outline: 2px solid var(--_ink); outline-offset: 2px; }
  .sound { display: flex; align-items: center; gap: 10px; min-height: 44px; margin-top: 8px; font-size: 15px; color: var(--_muted); cursor: pointer; }
  .sound input { width: 20px; height: 20px; margin: 0; accent-color: var(--_ink); flex: none; }
  .fine { margin: 6px 0 0; font-size: 13px; line-height: 1.45; color: var(--_muted); }
  .fine a { color: inherit; text-underline-offset: 3px; }
  .sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @container (min-width: 440px) {
    .card { padding: 28px; }
    .btns { grid-template-columns: 2fr 1fr 1fr; }
    button.go { grid-column: auto; }
  }
  @media (prefers-reduced-motion: reduce) { button:active { transform: none; } }
</style>
<div class="card" part="card">
  <p class="title" part="title" hidden></p>
  <p class="phase" part="phase"></p>
  <p class="clock" part="clock" role="timer" aria-live="off"></p>
  <p class="next" part="next"></p>
  <ol class="bar" part="bar" aria-hidden="true"></ol>
  <p class="sr" aria-live="assertive"></p>
  <div class="btns">
    <button type="button" class="go" part="button start" data-a="start">Start</button>
    <button type="button" part="button" data-a="skip">Skip ahead</button>
    <button type="button" part="button" data-a="reset">Reset</button>
  </div>
  <label class="sound" part="sound"><input type="checkbox" checked><span>Beep at the end of each part</span></label>
  <p class="fine" part="note">Step out sooner if you feel dizzy, sick or faint. Not medical advice.<span class="credit"> Timer by <a href="https://diveluxsaunahat.com" target="_blank" rel="noopener">DIVELUX</a>.</span></p>
</div>`;

const Base = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

class SaunaTimerElement extends Base {
  static get observedAttributes() { return ['rounds', 'heat', 'rest', 'cooldown', 'muted', 'heading', 'credit']; }

  constructor() {
    super();
    this._segments = [];
    this._index = 0;
    this._left = 0;        // ms left in the current part while paused
    this._endAt = 0;       // timestamp the current part ends while running
    this._running = false;
    this._done = false;
    this._tick = null;
    this._audio = null;
    this._wake = null;
    this._onVisible = () => {
      if (document.visibilityState === 'visible' && this._running) { this._requestWake(); this._frame(); }
    };
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = TEMPLATE;
    this._el = {
      title: root.querySelector('.title'), phase: root.querySelector('.phase'), clock: root.querySelector('.clock'),
      next: root.querySelector('.next'), bar: root.querySelector('.bar'), live: root.querySelector('.sr'),
      start: root.querySelector('[data-a="start"]'), skip: root.querySelector('[data-a="skip"]'),
      reset: root.querySelector('[data-a="reset"]'), sound: root.querySelector('.sound input'),
      credit: root.querySelector('.credit')
    };
    root.addEventListener('click', (e) => {
      const b = e.target.closest ? e.target.closest('[data-a]') : null;
      if (!b) return;
      const a = b.getAttribute('data-a');
      if (a === 'start') { this._initAudio(); if (this._running) this.pause(); else this.start(); }
      else if (a === 'skip') { this._initAudio(); this.skip(); }
      else this.reset();
    });
  }

  connectedCallback() {
    document.addEventListener('visibilitychange', this._onVisible);
    this._rebuild();
  }
  disconnectedCallback() {
    document.removeEventListener('visibilitychange', this._onVisible);
    this._stopTicking();
    this._releaseWake();
  }
  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === 'muted') { this._el.sound.checked = !this.hasAttribute('muted'); return; }
    if (name === 'heading' || name === 'credit') { this._chrome(); return; }
    this._rebuild(); // a new plan resets the timer
  }

  /* ---------- public API ---------- */
  get rounds() { return normalize(this._attrs()).rounds; }
  set rounds(v) { this.setAttribute('rounds', v); }
  get heat() { return normalize(this._attrs()).heat; }
  set heat(v) { this.setAttribute('heat', v); }
  get rest() { return normalize(this._attrs()).rest; }
  set rest(v) { this.setAttribute('rest', v); }
  get cooldown() { return normalize(this._attrs()).cooldown; }
  set cooldown(v) { this.setAttribute('cooldown', v); }
  get muted() { return this.hasAttribute('muted'); }
  set muted(v) { if (v) this.setAttribute('muted', ''); else this.removeAttribute('muted'); }

  /** Whether the clock is counting. */
  get running() { return this._running; }
  /** A snapshot: { status, index, segment, remainingMs, segments }. */
  get state() {
    const seg = this._segments[this._index] || null;
    return {
      status: this._done ? 'done' : this._running ? 'running' : this._started() ? 'paused' : 'idle',
      index: this._index,
      segment: seg ? Object.assign({}, seg) : null,
      remainingMs: this._done ? 0 : this._remaining(),
      segments: this._segments.map((s) => Object.assign({}, s))
    };
  }

  start() {
    if (this._running) return;
    if (this._done) this._toStart();
    const first = !this._started();
    this._endAt = Date.now() + this._left;
    this._running = true;
    this._requestWake();
    this._stopTicking();
    this._tick = setInterval(() => this._frame(), 250);
    this._draw();
    this._say(first ? this._describe() + ' Timer started.' : 'Timer running.');
    this._emit(first ? 'sauna-timer-start' : 'sauna-timer-resume');
  }
  pause() {
    if (!this._running) return;
    this._left = this._remaining();
    this._running = false;
    this._stopTicking();
    this._releaseWake();
    this._draw();
    this._say('Timer paused.');
    this._emit('sauna-timer-pause');
  }
  /** Jump to the next part. On the last part it finishes the session. */
  skip() {
    if (this._done) return;
    this._advance(false);
  }
  reset() {
    const was = this._started() || this._done;
    this._running = false;
    this._stopTicking();
    this._releaseWake();
    this._toStart();
    this._draw();
    if (was) { this._say('Timer reset.'); this._emit('sauna-timer-reset'); }
  }

  /* ---------- internals ---------- */
  _attrs() {
    return { rounds: this.getAttribute('rounds'), heat: this.getAttribute('heat'), rest: this.getAttribute('rest'), cooldown: this.getAttribute('cooldown') };
  }
  _started() {
    const seg = this._segments[this._index];
    return this._running || this._index > 0 || (!!seg && this._left < seg.minutes * 60000);
  }
  _remaining() { return this._running ? Math.max(0, this._endAt - Date.now()) : this._left; }
  _toStart() {
    this._index = 0;
    this._done = false;
    this._left = this._segments.length ? this._segments[0].minutes * 60000 : 0;
  }
  _rebuild() {
    this._running = false;
    this._stopTicking();
    this._releaseWake();
    this._segments = buildSegments(this._attrs());
    this._el.bar.innerHTML = this._segments.map((s) => '<li class="' + (s.kind === 'heat' ? 'heat' : 'rest') + '" style="flex-grow:' + s.minutes + '"><i></i></li>').join('');
    this._el.sound.checked = !this.hasAttribute('muted');
    this._chrome();
    this._toStart();
    this._draw();
  }
  _chrome() {
    const h = this.getAttribute('heading');
    this._el.title.hidden = !h;
    this._el.title.textContent = h || '';
    this._el.credit.hidden = this.getAttribute('credit') === 'off';
  }
  _describe(i) {
    const s = this._segments[i == null ? this._index : i];
    if (!s) return '';
    return s.kind === 'heat' ? s.label + ': in the heat, ' + s.minutes + ' min.' : s.label + ', ' + s.minutes + ' min.';
  }
  _frame() {
    if (!this._running) return;
    if (this._remaining() <= 0) this._advance(true);
    else this._draw();
  }
  _advance(natural) {
    const from = this._segments[this._index];
    if (this._index >= this._segments.length - 1) {
      this._running = false;
      this._done = true;
      this._left = 0;
      this._stopTicking();
      this._releaseWake();
      this._draw();
      if (natural) this._beep('done');
      this._say('Session finished. Drink some water and rest.');
      this._emit('sauna-timer-done');
      return;
    }
    this._index++;
    const seg = this._segments[this._index];
    this._left = seg.minutes * 60000;
    if (this._running) this._endAt = Date.now() + this._left;
    this._draw();
    if (natural) this._beep(from && from.kind === 'heat' ? 'out' : 'in');
    this._say(this._describe());
    this._emit('sauna-timer-phase');
  }
  _draw() {
    const el = this._el, seg = this._segments[this._index];
    if (!seg) return;
    const left = this._done ? 0 : this._remaining();
    const nextSeg = this._segments[this._index + 1];
    el.clock.textContent = formatClock(left);
    el.phase.textContent = this._done ? 'Session finished' :
      seg.kind === 'heat' ? seg.label + ': in the heat' : seg.label;
    el.next.textContent = this._done ? 'Drink some water and rest until your pulse feels normal.' :
      !this._started() ? this.rounds + (this.rounds === 1 ? ' round' : ' rounds') + ', ' + formatMinutes(totalMinutes(this._attrs())) + ' in all.' :
        nextSeg ? 'Next: ' + (nextSeg.kind === 'heat' ? 'round ' + nextSeg.round + ', ' : nextSeg.kind === 'cool' ? 'final cool-down, ' : 'cool-down, ') + nextSeg.minutes + ' min' : 'Last part.';
    el.start.textContent = this._running ? 'Pause' : this._done ? 'Start again' : this._started() ? 'Resume' : 'Start';
    el.skip.disabled = this._done;
    const items = el.bar.children;
    for (let i = 0; i < items.length; i++) {
      const full = this._done || i < this._index;
      const part = i === this._index && !this._done ? 1 - left / (this._segments[i].minutes * 60000) : 0;
      items[i].firstChild.style.width = (full ? 100 : Math.max(0, Math.min(1, part)) * 100).toFixed(1) + '%';
      items[i].className = (this._segments[i].kind === 'heat' ? 'heat' : 'rest') + (i === this._index && !this._done && this._started() ? ' now' : '');
    }
    this.setAttribute('data-status', this.state.status);
  }
  _say(text) { this._el.live.textContent = text; }
  _emit(type) {
    this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail: this.state }));
  }
  _stopTicking() { if (this._tick) { clearInterval(this._tick); this._tick = null; } }
  _initAudio() {
    // Must happen inside a tap or click, or mobile browsers keep it muted.
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!this._audio && AC) this._audio = new AC();
      if (this._audio && this._audio.state === 'suspended') this._audio.resume();
    } catch (e) { this._audio = null; }
  }
  _beep(kind) {
    if (navigator.vibrate) { try { navigator.vibrate(kind === 'done' ? [300, 150, 300, 150, 600] : [300, 150, 300]); } catch (e) { /* ignore */ } }
    const audio = this._audio;
    if (!this._el.sound.checked || !audio) return;
    const notes = kind === 'out' ? [880, 880, 880] : kind === 'in' ? [587, 784] : [784, 659, 523];
    const t0 = audio.currentTime + 0.05;
    notes.forEach((hz, i) => {
      const osc = audio.createOscillator(), gain = audio.createGain();
      const at = t0 + i * 0.42, len = kind === 'done' && i === 2 ? 0.9 : 0.3;
      osc.type = 'sine'; osc.frequency.value = hz;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.5, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + len);
      osc.connect(gain); gain.connect(audio.destination);
      osc.start(at); osc.stop(at + len + 0.05);
    });
  }
  _requestWake() {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator) || this._wake) return;
    navigator.wakeLock.request('screen').then((lock) => {
      if (!this._running) { lock.release(); return; }
      this._wake = lock;
      lock.addEventListener('release', () => { if (this._wake === lock) this._wake = null; });
    }).catch(() => { /* low battery, not allowed, etc. */ });
  }
  _releaseWake() {
    if (this._wake) { const w = this._wake; this._wake = null; try { w.release(); } catch (e) { /* ignore */ } }
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('sauna-timer')) {
  customElements.define('sauna-timer', SaunaTimerElement);
}

if (typeof window !== 'undefined') {
  window.SaunaTimer = { SaunaTimerElement, LIMITS, normalize, buildSegments, totalMinutes, formatClock, formatMinutes };
}
})();
