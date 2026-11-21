/*
 * The drawing code of the loading screen (see boot-splash.tsx).
 *
 * It is kept as plain JavaScript inside strings because it has to run somewhere React never goes: in a Web Worker,
 * drawing on an OffscreenCanvas.  A worker keeps animating while the page's main thread is busy running and
 * hydrating the app, which is exactly when ordinary CSS/SVG animations freeze and then jump.  Where workers or
 * OffscreenCanvas are missing, the same code runs on the page itself.
 *
 * Rules for editing the strings below: no backticks and no "${" (they sit inside String.raw templates), no "</script".
 * The animation is a pure function of time, BSS(...).draw(seconds), so any frame can be inspected on its own.
 */

/** BSS(canvas, init, raf): draws the emblem forming as a cup of tea.  Also contains the worker's message handler. */
export const ENGINE_SRC = String.raw`
function BSS(canvas, init, raf) {
  var ctx = canvas.getContext("2d");
  var CX = 1057, CY = 1183, RT = 261, TAU = Math.PI * 2;
  var WX = -250, WY = -650, WW = 2500;               /* the canvas shows this window of the 2000 x 2000 logo space */
  var DEEP = [27, 67, 50], LEAF = [125, 162, 64];
  var art = init.art;

  function cl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function eo(x) { x = 1 - cl(x); return 1 - x * x * x; }
  function eio(x) { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(2 - 2 * x, 3) / 2; }
  function eb(x, c) { x = cl(x) - 1; return 1 + (c + 1) * x * x * x + c * x * x; }
  function mix(a, b, k) {
    return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * k) + "," + Math.round(a[1] + (b[1] - a[1]) * k) + "," + Math.round(a[2] + (b[2] - a[2]) * k) + ")";
  }
  function cub(a, b, c, d, t) { var u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; }
  function flat(p) {
    var o = [], i, j, t;
    for (i = 0; i < 2; i++) for (j = i ? 1 : 0; j <= 16; j++) {
      t = j / 16;
      o.push([cub(p[i * 6], p[i * 6 + 2], p[i * 6 + 4], p[i * 6 + 6], t), cub(p[i * 6 + 1], p[i * 6 + 3], p[i * 6 + 5], p[i * 6 + 7], t)]);
    }
    return o;
  }

  var frames = art.frame.map(function (f) { return { p: new Path2D(f.d), n: f.len }; });
  var rings = [[], []];
  art.segs.forEach(function (s) { rings[s.r].push({ p: new Path2D(s.d), f: s.f, x: s.x, y: s.y }); });
  var arrow = new Path2D(art.arrow);
  var dropP = new Path2D("M0-46C22-14 34 6 34 22C34 42 18 56 0 56C-18 56-34 42-34 22C-34 6-22-14 0-46Z");
  var sheen = new Path2D("M857 1076A227 227 0 0 1 972 973M1025 958A227 227 0 0 1 1065 956");
  var wisps = [
    flat([880, 6, 820, -80, 940, -130, 880, -220, 830, -295, 920, -350, 868, -440]),
    flat([980, -6, 920, -100, 1040, -160, 980, -260, 930, -340, 1020, -400, 962, -500]),
    flat([1074, 24, 1028, -56, 1120, -112, 1066, -196, 1026, -262, 1098, -312, 1060, -392])
  ];
  var arms = [0, 1].map(function (k) {
    var o = [], n = 60, i, a, r;
    for (i = 0; i <= n; i++) { a = (i / n) * 1.35 * TAU + k * Math.PI; r = RT * (0.1 + 0.82 * i / n); o.push([Math.cos(a) * r, Math.sin(a) * r]); }
    return o;
  });
  var crown = [[-1, 0.9], [-0.66, 1.1], [-0.33, 1.25], [0, 1.3], [0.33, 1.25], [0.66, 1.1], [1, 0.9]];
  var RING_T = [0.62, 0.78], RING_DIR = [-1, 1];

  function draw(t) {
    var s = canvas.width / WW, i, j, u, a, r, k, g, sg, w, n, b;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(s, 0, 0, s, -WX * s, -WY * s);
    k = 1 + 0.03 * Math.sin(Math.PI * cl((t - 1.95) / 0.6));          /* a small settle once the emblem is complete */
    ctx.translate(1000, 1000); ctx.scale(k, k); ctx.translate(-1000, -1000);

    /* warm glow behind the cup */
    u = eo((t - 0.5) / 0.9);
    if (u > 0) {
      g = ctx.createRadialGradient(CX, CY, 40, CX, CY, 980);
      a = 0.24 * u * (0.88 + 0.12 * Math.sin(t * 2.2));
      g.addColorStop(0, "rgba(232,168,78," + a + ")"); g.addColorStop(1, "rgba(232,168,78,0)");
      ctx.fillStyle = g; ctx.fillRect(WX, WY, WW, 2800);
    }

    /* the tea fills the cup */
    u = (t - 0.5) / 0.75;
    r = u > 0 ? RT * eb(u, 1.1) : 0;
    if (r > 1) {
      g = ctx.createRadialGradient(CX, CY, 0, CX, CY, r);
      g.addColorStop(0, "#e5a84f"); g.addColorStop(0.55, "#c47c2b"); g.addColorStop(1, "#8c4c16");
      ctx.beginPath(); ctx.arc(CX, CY, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = 9; ctx.strokeStyle = "#7b4112"; ctx.stroke();
      ctx.save();
      ctx.beginPath(); ctx.arc(CX, CY, r - 4, 0, TAU); ctx.clip();
      a = 0.36 * eo((t - 1) / 0.7);                                  /* two arms of milk-coloured tea swirl round */
      if (a > 0) {
        ctx.save(); ctx.translate(CX, CY); ctx.rotate(-(t - 1) * 0.9); ctx.lineCap = "round"; ctx.strokeStyle = "#f6d08a";
        for (j = 0; j < 2; j++) for (i = 0; i < 12; i++) {
          sg = arms[j]; w = i / 11;
          ctx.globalAlpha = a * (0.2 + 0.8 * w); ctx.lineWidth = 6 + 18 * w;
          ctx.beginPath(); ctx.moveTo(sg[i * 5][0], sg[i * 5][1]);
          for (n = i * 5 + 1; n <= i * 5 + 5; n++) ctx.lineTo(sg[n][0], sg[n][1]);
          ctx.stroke();
        }
        ctx.restore();
      }
      a = 0.34 * eo((t - 1.1) / 0.8);                                /* wet highlights near the rim */
      if (a > 0) { ctx.globalAlpha = a; ctx.lineWidth = 14; ctx.lineCap = "round"; ctx.strokeStyle = "#fff"; ctx.stroke(sheen); ctx.globalAlpha = 1; }
      [0.5, 0.85].forEach(function (t0) {                            /* ripples from the drop, then a slow one while we wait */
        var q = (t - t0) / 1.1;
        if (q > 0 && q < 1) { ctx.globalAlpha = 0.5 * (1 - q); ctx.lineWidth = 5; ctx.strokeStyle = "#7b4112"; ctx.beginPath(); ctx.arc(CX, CY, RT * (0.15 + 0.82 * eo(q)), 0, TAU); ctx.stroke(); }
      });
      if (t > 2.2) {
        u = ((t - 2.2) % 2.4) / 2.4;
        ctx.globalAlpha = 0.24 * (1 - u); ctx.lineWidth = 5; ctx.strokeStyle = "#7b4112"; ctx.beginPath(); ctx.arc(CX, CY, RT * (0.15 + 0.82 * eo(u)), 0, TAU); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    /* the frame is drawn from the bottom, out and up to the gap the arrow leaves through */
    u = eio((t - 0.25) / 1.05);
    if (u > 0) {
      ctx.lineWidth = 35; ctx.strokeStyle = "#1b4332"; ctx.lineJoin = "miter"; ctx.lineCap = "butt";
      for (i = 0; i < frames.length; i++) { ctx.setLineDash([frames[i].n * u + 0.01, frames[i].n * 2]); ctx.stroke(frames[i].p); }
      ctx.setLineDash([]);
    }

    /* the two rings swirl in segment by segment: fresh leaf green first, then steeped dark */
    for (j = 0; j < 2; j++) {
      u = (t - RING_T[j]) / 1.3;
      if (u <= 0) continue;
      ctx.save();
      ctx.translate(CX, CY); ctx.rotate(RING_DIR[j] * 1.31 * (1 - eo(u))); ctx.translate(-CX, -CY);
      for (i = 0; i < rings[j].length; i++) {
        sg = rings[j][i];
        w = (t - RING_T[j] - sg.f * 0.5) / 0.5;
        if (w <= 0) continue;
        b = 0.3 + 0.7 * eb(w, 1.4);
        ctx.globalAlpha = cl(w * 2);
        ctx.fillStyle = mix(LEAF, DEEP, eio((t - RING_T[j] - sg.f * 0.5 - 0.12) / 1.0));
        ctx.save(); ctx.translate(sg.x, sg.y); ctx.scale(b, b); ctx.translate(-sg.x, -sg.y);
        ctx.fill(sg.p, "evenodd");
        ctx.restore();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    /* the arrow swings out of the wheel */
    u = (t - 1.05) / 0.85;
    if (u > 0) {
      ctx.save();
      ctx.translate(CX, CY); ctx.rotate(-0.942 * (1 - eb(u, 1.2))); ctx.scale(0.94 + 0.06 * eo(u), 0.94 + 0.06 * eo(u)); ctx.translate(-CX, -CY);
      ctx.globalAlpha = cl(u / 0.4); ctx.fillStyle = "#1b4332"; ctx.fill(arrow, "evenodd");
      ctx.restore();
    }

    /* steam keeps curling up from the arrow head */
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 32;
    for (i = 0; i < 3; i++) {
      a = 1.35 + i * 0.42;
      if (t < a) continue;
      u = ((t - a) % 2.8) / 2.8;
      b = eo(u) * 1.4;
      w = Math.max(0, b - 0.55); b = Math.min(1, b);
      if (b <= w) continue;
      ctx.globalAlpha = 0.58 * (u < 0.1 ? u / 0.1 : u > 0.6 ? (1 - u) / 0.4 : 1);
      ctx.strokeStyle = "#1b4332";
      sg = wisps[i]; ctx.beginPath();
      for (n = Math.floor(w * 32); n <= Math.ceil(b * 32); n++) { if (n === Math.floor(w * 32)) ctx.moveTo(sg[n][0], sg[n][1]); else ctx.lineTo(sg[n][0], sg[n][1]); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* a splash of droplets where the drop lands */
    u = t - 0.5;
    if (u > 0 && u < 0.6) {
      ctx.fillStyle = "#c27a2a";
      for (i = 0; i < crown.length; i++) {
        ctx.globalAlpha = 1 - u / 0.6;
        ctx.beginPath(); ctx.arc(CX + crown[i][0] * 430 * u, CY - 30 - 1000 * crown[i][1] * u + 1700 * u * u, 15 - 9 * (u / 0.6), 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    /* the drop of tea */
    if (t < 0.58) {
      u = cl(t / 0.5);
      a = cl(t / 0.06); w = 2; k = 2 * (1 + 0.3 * u);
      if (t >= 0.5) { b = cl((t - 0.5) / 0.08); w = 2 * (1 + 1.3 * b); k = 2 * (1.3 - 1.05 * b); a = 1 - b; }
      ctx.save();
      ctx.translate(CX, -330 + (CY + 330) * u * u - 56 * k); ctx.scale(w, k);
      ctx.globalAlpha = a; ctx.fillStyle = "#c27a2a"; ctx.fill(dropP);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  var t0 = 0, dead = false;
  function loop(ts) {
    if (dead) return;
    if (!t0) t0 = ts;
    draw((ts - t0) / 1000);
    raf(loop);
  }
  function size(w, h) { canvas.width = w; canvas.height = h; }
  size(init.w, init.h);
  if (!init.manual) raf(loop);
  return { draw: draw, size: size, stop: function () { dead = true; } };
}

if (typeof WorkerGlobalScope !== "undefined" && typeof self !== "undefined" && self instanceof WorkerGlobalScope) {
  var ctl;
  self.onmessage = function (e) {
    var m = e.data;
    if (m.type === "init") {
      ctl = BSS(m.canvas, m.init, self.requestAnimationFrame
        ? function (f) { return self.requestAnimationFrame(f); }
        : function (f) { return setTimeout(function () { f(performance.now()); }, 16); });
      self.postMessage({ type: "ready" });
    } else if (m.type === "size") { if (ctl) ctl.size(m.w, m.h); }
    else if (m.type === "stop") { if (ctl) ctl.stop(); self.close(); }
  };
}
`;

/**
 * Runs inside the page right after the splash markup: reads the finished emblem (the still SVG that is also the
 * fallback), hands it to a worker together with the canvas, and keeps the canvas sized.  If anything is missing
 * or fails it switches the splash to the still emblem (data-canvas="off") so the screen is never empty.
 */
export const BOOT_JS = String.raw`
(function () {
  var d = document, de = d.documentElement, root = d.querySelector(".boot-splash");
  if (!root || de.getAttribute("data-splash") === "skip") return;
  root.setAttribute("data-t0", String(Math.round(performance.now()))); // when the splash arrived: the minimum time is counted from here
  var cv = root.querySelector(".boot-canvas"), src = d.getElementById("bss-engine");
  function off() { root.setAttribute("data-canvas", "off"); }
  if (!cv || !src || !cv.getContext || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) { off(); return; }
  try {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), r = cv.getBoundingClientRect();
    var art = { frame: [], segs: [], arrow: "" }, i, el, list, bb;
    list = root.querySelectorAll(".bf");
    for (i = 0; i < list.length; i++) art.frame.push({ d: list[i].getAttribute("d"), len: list[i].getTotalLength() });
    list = root.querySelectorAll(".bs");
    for (i = 0; i < list.length; i++) {
      el = list[i]; bb = el.getBBox();
      art.segs.push({ d: el.getAttribute("d"), f: +el.getAttribute("data-f"), r: +el.getAttribute("data-r"), x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 });
    }
    art.arrow = root.querySelector(".ba").getAttribute("d");
    var engine = src.textContent;
    var init = { art: art, w: Math.max(2, Math.round(r.width * dpr)), h: Math.max(2, Math.round(r.height * dpr)) };
    if (window.Worker && window.OffscreenCanvas && cv.transferControlToOffscreen && window.URL && window.Blob) {
      var oc = cv.transferControlToOffscreen();
      var url = URL.createObjectURL(new Blob([engine], { type: "text/javascript" }));
      var wk = new Worker(url), dog = setTimeout(off, 6000);
      wk.onerror = function () { clearTimeout(dog); off(); };
      wk.onmessage = function () { clearTimeout(dog); };
      wk.postMessage({ type: "init", canvas: oc, init: init }, [oc]);
      window.__bssSplash = { stop: function () { try { wk.postMessage({ type: "stop" }); } catch (e) {} setTimeout(function () { wk.terminate(); URL.revokeObjectURL(url); }, 60); } };
      if (window.ResizeObserver) new ResizeObserver(function () {
        var q = cv.getBoundingClientRect();
        if (q.width > 1) wk.postMessage({ type: "size", w: Math.round(q.width * dpr), h: Math.round(q.height * dpr) });
      }).observe(cv);
    } else {
      var ctl = new Function(engine + "; return BSS;")()(cv, init, function (f) { return requestAnimationFrame(f); });
      window.__bssSplash = { stop: function () { ctl.stop(); }, draw: ctl.draw };
    }
    root.setAttribute("data-live", "1");
  } catch (e) { off(); }
})();
`;
