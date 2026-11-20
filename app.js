/* Grid References — interactive map, finder and quiz */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const E0 = 20, N0 = 40, SIZE = 10;   // eastings 20–30, northings 40–50
  const CELL = 100;                     // svg units per grid square

  // ---------- coordinate helpers ----------
  const toX = e => (e - E0) * CELL;
  const toY = n => (N0 + SIZE - n) * CELL;
  const fromX = x => E0 + x / CELL;
  const fromY = y => N0 + SIZE - y / CELL;
  const ref4 = (e, n) => `${Math.floor(e + 1e-9)}${Math.floor(n + 1e-9)}`;
  const ref6 = (e, n) => `${Math.floor(e * 10 + 1e-6)}${Math.floor(n * 10 + 1e-6)}`;
  const fmt6 = r => `${r.slice(0, 3)} ${r.slice(3)}`;

  const el = (tag, attrs = {}, parent) => {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  };

  // ---------- features ----------
  // Each icon is drawn centred on 0,0 at roughly 40 units wide.
  const ICONS = {
    church: `<circle r="19" fill="#1d1d1f" stroke="#fff" stroke-width="2.5"/><path d="M0-12v24M-8-4h16" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
    school: `<rect x="-20" y="-20" width="40" height="40" rx="10" fill="#ff9500"/><path d="M-11 9V-2L0-11 11-2v11z" fill="#fff"/>`,
    windmill: `<circle r="20" fill="#5856d6"/><path d="M-11-11L11 11M11-11L-11 11" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle r="4" fill="#fff"/>`,
    parking: `<rect x="-20" y="-20" width="40" height="40" rx="10" fill="#0071e3"/><text y="10" text-anchor="middle" font-size="28" font-weight="800" fill="#fff" font-family="-apple-system,Helvetica,Arial">P</text>`,
    farm: `<rect x="-20" y="-20" width="40" height="40" rx="10" fill="#a2845e"/><text y="7" text-anchor="middle" font-size="18" font-weight="800" fill="#fff" font-family="-apple-system,Helvetica,Arial">Fm</text>`,
    camp: `<circle r="20" fill="#34c759"/><path d="M0-11L13 10H-13z" fill="#fff"/><path d="M0 0L5 10H-5z" fill="#34c759"/>`,
    post: `<circle r="20" fill="#ff3b30"/><rect x="-11" y="-7" width="22" height="15" rx="2" fill="#fff"/><path d="M-11-6L0 2 11-6" stroke="#ff3b30" stroke-width="2.5" fill="none"/>`,
    picnic: `<circle r="20" fill="#30b0c7"/><path d="M-12-4h24M-8 11l5-15M8 11L3-4M-12 4h24" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`,
    view: `<circle r="20" fill="#af52de"/><path d="M-12 6a12 12 0 0 1 24 0z" fill="#fff"/><path d="M0-6v-6M-9-3l-4-4M9-3l4-4" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
    pub: `<rect x="-20" y="-20" width="40" height="40" rx="10" fill="#8e5b2e"/><text y="7" text-anchor="middle" font-size="17" font-weight="800" fill="#fff" font-family="-apple-system,Helvetica,Arial">PH</text>`,
    station: `<circle r="20" fill="#ff2d55"/><rect x="-8" y="-11" width="16" height="17" rx="4" fill="#fff"/><path d="M-6 12l3-5M6 12L3 7" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="-3" r="3" fill="#ff2d55"/>`,
  };

  const FEATURES = [
    { id: "church",  name: "Church",       e: 24.3, n: 45.7 },
    { id: "school",  name: "School",       e: 21.6, n: 48.2 },
    { id: "windmill",name: "Windmill",     e: 27.2, n: 47.6 },
    { id: "parking", name: "Car park",     e: 25.4, n: 42.9 },
    { id: "farm",    name: "Farm",         e: 22.8, n: 42.4 },
    { id: "camp",    name: "Campsite",     e: 22.4, n: 40.8 },
    { id: "post",    name: "Post office",  e: 28.2, n: 48.6 },
    { id: "picnic",  name: "Picnic site",  e: 27.3, n: 41.8 },
    { id: "view",    name: "Viewpoint",    e: 20.9, n: 42.3 },
    { id: "pub",     name: "Pub",          e: 25.8, n: 45.2 },
    { id: "station", name: "Train station",e: 29.4, n: 42.6 },
  ];
  FEATURES.forEach(f => { f.r4 = ref4(f.e, f.n); f.r6 = ref6(f.e, f.n); });
  const lc = f => f.name.toLowerCase();

  const DIRS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
  const ABBR = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  // bearing of a from b, in degrees clockwise from north
  const bearing = (a, b) => (Math.atan2(a.e - b.e, a.n - b.n) * 180 / Math.PI + 360) % 360;

  // ---------- draw a map into an <svg> ----------
  function drawMap(svg, { interactiveFeatures = true } = {}) {
    svg.innerHTML = "";
    const base = el("g", {}, svg);
    el("rect", { x: 0, y: 0, width: 1000, height: 1000, class: "m-land", rx: 6 }, base);

    [[60, 45], [100, 75], [140, 105]].forEach(([rx, ry]) =>
      el("ellipse", { cx: 90, cy: 770, rx, ry, class: "m-contour" }, base));

    el("path", { class: "m-wood", d: "M60 300 C 120 260, 230 270, 275 320 C 310 370, 270 450, 220 470 C 150 500, 70 470, 50 410 C 35 360, 40 320, 60 300 Z" }, base);
    [[100,330],[150,310],[205,320],[245,360],[90,390],[145,375],[200,400],[245,420],[110,440],[170,450]]
      .forEach(([x, y]) => el("circle", { cx: x, cy: y, r: 9, class: "m-tree" }, base));

    el("path", { class: "m-river", d: "M500 0 C 520 150, 640 330, 720 480" }, base);
    el("path", { class: "m-river", d: "M800 565 C 840 700, 900 850, 960 1000" }, base);
    el("ellipse", { cx: 760, cy: 520, rx: 80, ry: 55, class: "m-water" }, base);

    const roads = ["M0 620 C 250 600, 500 660, 1000 600", "M380 1000 C 400 700, 330 400, 300 0"];
    roads.forEach(d => el("path", { d, class: "m-road-edge" }, base));
    roads.forEach(d => el("path", { d, class: "m-road" }, base));

    const grid = el("g", {}, svg);
    for (let i = 0; i <= SIZE; i++) {
      const p = i * CELL;
      el("line", { x1: p, y1: 0, x2: p, y2: 1000, class: "m-gridline" }, grid);
      el("line", { x1: 0, y1: p, x2: 1000, y2: p, class: "m-gridline" }, grid);
      el("text", { x: p, y: 1040, class: "m-gridnum" }, grid).textContent = E0 + i;
      el("text", { x: -32, y: 1000 - p + 9, class: "m-gridnum" }, grid).textContent = N0 + i;
    }

    const overlay = el("g", {}, svg);
    const hoverSq = el("rect", { width: CELL, height: CELL, class: "m-hover-sq" }, overlay);
    const crossV = el("line", { y1: 0, y2: 1000, class: "m-cross" }, overlay);
    const crossH = el("line", { x1: 0, x2: 1000, class: "m-cross" }, overlay);
    const marks = el("g", {}, svg);

    const fLayer = el("g", {}, svg);
    const nodes = {};
    FEATURES.forEach(f => {
      const g = el("g", { class: "m-feature", transform: `translate(${toX(f.e)} ${toY(f.n)})`, "data-id": f.id }, fLayer);
      if (interactiveFeatures) { g.setAttribute("tabindex", 0); g.setAttribute("role", "button"); g.setAttribute("aria-label", f.name); }
      else g.style.pointerEvents = "none";
      el("circle", { r: 32, class: "halo" }, g);
      el("g", { class: "sym" }, g).innerHTML = ICONS[f.id];
      el("circle", { r: 28, class: "hit" }, g);
      nodes[f.id] = g;
    });

    return { svg, hoverSq, crossV, crossH, marks, nodes };
  }

  function svgPoint(svg, evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  const inMap = p => p.x >= 0 && p.x < 1000 && p.y > 0 && p.y <= 1000;

  function showHover(m, x, y, withCross = true) {
    m.hoverSq.setAttribute("x", Math.floor(x / CELL) * CELL);
    m.hoverSq.setAttribute("y", (Math.ceil(y / CELL) - 1) * CELL);
    m.hoverSq.style.opacity = 1;
    if (withCross) {
      m.crossV.setAttribute("x1", x); m.crossV.setAttribute("x2", x);
      m.crossH.setAttribute("y1", y); m.crossH.setAttribute("y2", y);
      m.crossV.style.opacity = m.crossH.style.opacity = .6;
    }
    return { e: fromX(x), n: fromY(y) };
  }
  function hideHover(m) {
    m.hoverSq.style.opacity = 0;
    m.crossV.style.opacity = m.crossH.style.opacity = 0;
  }
  const squareRect = (m, e, n, cls) =>
    el("rect", { x: toX(e), y: toY(n + 1), width: CELL, height: CELL, class: `m-flash ${cls}` }, m.marks);
  function pin(m, x, y) {
    const g = el("g", { class: "m-pin", transform: `translate(${x} ${y})` }, m.marks);
    el("circle", { r: 14, class: "pulse" }, g);
    el("circle", { r: 10 }, g);
  }
  function arrowBetween(m, from, to) {
    const x1 = toX(from.e), y1 = toY(from.n), x2 = toX(to.e), y2 = toY(to.n);
    const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const sx = x1 + ux * 36, sy = y1 + uy * 36, ex = x2 - ux * 40, ey = y2 - uy * 40;
    el("line", { x1: sx, y1: sy, x2: ex, y2: ey, stroke: "var(--accent)", "stroke-width": 6, "stroke-linecap": "round", "stroke-dasharray": "2 14", class: "m-flash" }, m.marks);
    const a = Math.atan2(uy, ux) * 180 / Math.PI;
    el("path", { d: "M0 0L-26-14L-26 14Z", fill: "var(--accent)", transform: `translate(${ex} ${ey}) rotate(${a})`, class: "m-flash" }, m.marks);
  }

  // ---------- Learn diagrams ----------
  (function tenthsDiagram() {
    const svg = document.getElementById("tenthsDiagram");
    const x0 = 70, y0 = 20, s = 130, t = s / 10;
    el("rect", { x: x0, y: y0, width: s, height: s, class: "d-square" }, svg);
    for (let i = 1; i < 10; i++) {
      el("line", { x1: x0 + i * t, y1: y0, x2: x0 + i * t, y2: y0 + s, class: "d-tick" }, svg);
      el("line", { x1: x0, y1: y0 + i * t, x2: x0 + s, y2: y0 + i * t, class: "d-tick" }, svg);
    }
    const g = el("g", { class: "d-grid" }, svg);
    el("path", { d: `M${x0} ${y0 - 10}v${s + 20}M${x0 + s} ${y0 - 10}v${s + 20}M${x0 - 10} ${y0}h${s + 20}M${x0 - 10} ${y0 + s}h${s + 20}` }, g);
    const px = x0 + 3 * t, py = y0 + s - 7 * t;
    el("path", { d: `M${px} ${y0 + s}V${py}M${x0} ${py}H${px}`, class: "d-guide" }, svg);
    el("circle", { cx: px, cy: py, r: 6, class: "d-dot" }, svg);
    const label = (x, y, txt, cls = "d-num") => { el("text", { x, y, class: cls }, svg).textContent = txt; };
    label(x0, y0 + s + 28, "24"); label(x0 + s, y0 + s + 28, "25");
    label(x0 - 26, y0 + s + 5, "45"); label(x0 - 26, y0 + 5, "46");
    label(px, y0 + s + 16, "3", "d-label"); label(x0 + 10, py - 6, "7", "d-label");
  })();

  (function compassDiagram() {
    const svg = document.getElementById("compassDiagram");
    const cx = 120, cy = 90;
    el("circle", { cx, cy, r: 58, class: "c-ring" }, svg);
    for (let i = 0; i < 8; i++) {
      const a = (i * 45 - 90) * Math.PI / 180, main = i % 2 === 0;
      const r = main ? 52 : 34, w = main ? 9 : 6;
      const tip = [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
      const l = [cx + Math.cos(a + Math.PI / 2) * w, cy + Math.sin(a + Math.PI / 2) * w];
      const rr = [cx + Math.cos(a - Math.PI / 2) * w, cy + Math.sin(a - Math.PI / 2) * w];
      el("path", { d: `M${tip}L${l}L${cx} ${cy}L${rr}Z`, class: main ? "c-main" : "c-minor" }, svg);
      const lr = main ? 74 : 72;
      el("text", { x: cx + Math.cos(a) * lr, y: cy + Math.sin(a) * lr, class: "c-lbl" + (main ? "" : " minor") }, svg).textContent = ABBR[i];
    }
    el("circle", { cx, cy, r: 5, fill: "var(--card)", stroke: "var(--accent)", "stroke-width": 2 }, svg);
  })();

  // ---------- Explore ----------
  const ex = drawMap(document.getElementById("exploreMap"));
  const out4 = document.getElementById("out4");
  const out6 = document.getElementById("out6");
  const info = document.getElementById("featureInfo");
  const zoomSvg = document.getElementById("zoomSvg");
  const zoomText = document.getElementById("zoomText");
  let activeFeature = null;

  function drawZoom(e, n) {
    const E = Math.floor(e + 1e-9), N = Math.floor(n + 1e-9);
    const te = Math.min(9, Math.floor((e - E) * 10 + 1e-6)), tn = Math.min(9, Math.floor((n - N) * 10 + 1e-6));
    const px = (e - E) * 200, py = 200 - (n - N) * 200;
    zoomSvg.innerHTML = "";
    el("rect", { x: 0, y: 0, width: 200, height: 200, class: "z-sq" }, zoomSvg);
    for (let i = 1; i < 10; i++) {
      el("line", { x1: i * 20, y1: 0, x2: i * 20, y2: 200, class: "z-tick" }, zoomSvg);
      el("line", { x1: 0, y1: i * 20, x2: 200, y2: i * 20, class: "z-tick" }, zoomSvg);
    }
    el("rect", { x: te * 20, y: 200 - (tn + 1) * 20, width: 20, height: 20, fill: "var(--accent-soft)" }, zoomSvg);
    el("path", { d: `M0 200H${px}`, class: "z-line z-e" }, zoomSvg);
    el("path", { d: `M${px} 200V${py}`, class: "z-line z-n" }, zoomSvg);
    el("circle", { cx: px, cy: py, r: 8, class: "z-dot" }, zoomSvg);
    el("text", { x: 0, y: 228, class: "z-num" }, zoomSvg).textContent = E;
    el("text", { x: 200, y: 228, class: "z-num" }, zoomSvg).textContent = E + 1;
    el("text", { x: -22, y: 207, class: "z-num" }, zoomSvg).textContent = N;
    el("text", { x: -22, y: 8, class: "z-num" }, zoomSvg).textContent = N + 1;
    zoomText.innerHTML =
      `<span style="color:var(--accent)">Along:</span> <strong>${E}</strong> + <strong>${te}</strong> tenths → <span class="ref">${E}${te}</span><br>` +
      `<span style="color:#af52de">Up:</span> <strong>${N}</strong> + <strong>${tn}</strong> tenths → <span class="ref">${N}${tn}</span><br>` +
      `So the 6-figure ref is <span class="ref">${E}${te} ${N}${tn}</span>`;
  }

  function readout(e, n) {
    out4.textContent = ref4(e, n);
    out6.textContent = fmt6(ref6(e, n));
    drawZoom(e, n);
  }
  const onMove = evt => {
    const p = svgPoint(ex.svg, evt);
    if (!inMap(p)) { hideHover(ex); return; }
    const { e, n } = showHover(ex, p.x, p.y);
    readout(e, n);
  };
  ex.svg.addEventListener("pointermove", onMove);
  ex.svg.addEventListener("pointerdown", onMove);
  ex.svg.addEventListener("pointerleave", () => hideHover(ex));

  function selectFeature(f) {
    if (activeFeature) ex.nodes[activeFeature].classList.remove("active");
    activeFeature = f.id;
    ex.nodes[f.id].classList.add("active");
    readout(f.e, f.n);
    info.innerHTML = `<strong>${f.name}</strong>: 4-figure <span class="ref">${f.r4}</span>, 6-figure <span class="ref">${fmt6(f.r6)}</span>`;
  }
  FEATURES.forEach(f => {
    const node = ex.nodes[f.id];
    node.addEventListener("click", () => selectFeature(f));
    node.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectFeature(f); } });
  });

  const legend = document.getElementById("legend");
  FEATURES.forEach(f => {
    const li = document.createElement("li");
    li.innerHTML = `<svg viewBox="-22 -22 44 44">${ICONS[f.id]}</svg>${f.name}`;
    li.style.cursor = "pointer";
    li.addEventListener("click", () => selectFeature(f));
    legend.appendChild(li);
  });

  // finder
  const findForm = document.getElementById("findForm");
  const findInput = document.getElementById("findInput");
  const findMsg = document.getElementById("findMsg");
  findInput.addEventListener("input", () => { findInput.value = findInput.value.replace(/[^\d ]/g, ""); });
  findForm.addEventListener("submit", evt => {
    evt.preventDefault();
    const v = findInput.value.replace(/\s/g, "");
    ex.marks.innerHTML = "";
    let e, n, fe, fn;
    if (v.length === 4) { e = +v.slice(0, 2); n = +v.slice(2); fe = e; fn = n; }
    else if (v.length === 6) { e = +v.slice(0, 3) / 10; n = +v.slice(3) / 10; fe = Math.floor(e); fn = Math.floor(n); }
    else { findMsg.textContent = "Type 4 or 6 digits."; return; }
    if (fe < E0 || fe >= E0 + SIZE || fn < N0 || fn >= N0 + SIZE) {
      findMsg.innerHTML = `That's off this map. Eastings go <strong>20–29</strong>, northings <strong>40–49</strong>.`;
      return;
    }
    squareRect(ex, fe, fn, "m-good");
    let here;
    if (v.length === 6) {
      pin(ex, toX(e + 0.05), toY(n + 0.05));
      here = FEATURES.find(f => f.r6 === v)?.name;
      readout(e + 0.05, n + 0.05);
    } else {
      here = FEATURES.filter(f => f.r4 === v).map(f => f.name).join(", ");
      readout(fe + 0.5, fn + 0.5);
    }
    findMsg.innerHTML = here
      ? `Found: <strong>${here}</strong>`
      : v.length === 4 ? `Square <span class="ref">${v}</span> is highlighted.` : `Point <span class="ref">${fmt6(v)}</span> is pinned.`;
  });
  drawZoom(24.3, 45.7);

  // ---------- Quiz ----------
  const qm = drawMap(document.getElementById("quizMap"), { interactiveFeatures: false });
  const $ = id => document.getElementById(id);
  const qCount = $("qCount"), qScore = $("qScore"), qProgress = $("qProgress"), qText = $("qText");
  const qOptions = $("qOptions"), qFeedback = $("qFeedback"), qNext = $("qNext");
  const qModes = $("qModes"), qModeInfo = $("qModeInfo");
  const TOTAL = 10;
  const MODES = {
    four:  { label: "4-figure", info: "Name squares, find what's in them, and tap the right square.",
             types: ["ref4", "ref4", "ref4", "ref4", "what4", "what4", "tap", "tap", "tap", "tap"] },
    six:   { label: "6-figure", info: "Pin-point places using tenths of a square.",
             types: ["ref6", "ref6", "ref6", "ref6", "ref6", "ref6", "what6", "what6", "what6", "what6"] },
    mixed: { label: "Mixed", info: "A bit of everything, plus compass directions.",
             types: ["ref4", "ref4", "ref6", "ref6", "ref6", "what6", "tap", "dir", "dir", "dir"] },
  };
  let mode = store.get("gr-mode") in MODES ? store.get("gr-mode") : "four";
  let questions = [], qi = -1, score = 0, streak = 0, answered = false, missed = [];

  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const uniq = (correct, pool, n = 4) => {
    const out = [correct];
    for (const p of shuffle([...pool])) { if (out.length >= n) break; if (!out.includes(p)) out.push(p); }
    return shuffle(out);
  };
  const bestKey = m => `gr-best-${m}`;
  const best = m => +(store.get(bestKey(m)) || 0);

  function setMode(m) {
    mode = m;
    store.set("gr-mode", m);
    [...qModes.children].forEach(b => b.setAttribute("aria-checked", b.dataset.mode === m));
    const b = best(m);
    qModeInfo.innerHTML = `${MODES[m].info}${b ? ` <span class="best">Best: ${b}/${TOTAL}</span>` : ""}`;
  }
  [...qModes.children].forEach(b => b.addEventListener("click", () => setMode(b.dataset.mode)));

  function dirPair() {
    for (let tries = 0; tries < 200; tries++) {
      const [a, b] = shuffle([...FEATURES]);
      const d = bearing(a, b), idx = Math.round(d / 45) % 8;
      if (Math.abs(d - idx * 45) % 360 < 14 || Math.abs(d - idx * 45 - 360) < 14) return { a, b, idx };
    }
    return { a: FEATURES[1], b: FEATURES[0], idx: 7 };
  }

  function makeQuestions() {
    const types = shuffle([...MODES[mode].types]);
    const feats = shuffle([...FEATURES]);
    let fi = 0;
    return types.map(type => {
      const f = feats[fi++ % feats.length];
      if (type === "ref4") {
        const e = Math.floor(f.e), n = Math.floor(f.n);
        const pool = [`${n}${e}`, `${e + 1}${n}`, `${e}${n + 1}`, `${e - 1}${n}`, `${e}${n - 1}`, `${e + 1}${n + 1}`];
        return { type, f, text: `What is the 4-figure grid reference for the <strong>${lc(f)}</strong>?`, answer: f.r4, options: uniq(f.r4, pool), mono: true,
          why: `Go along to ${e}, then up to ${n}: <span class="ref">${f.r4}</span>.` };
      }
      if (type === "ref6") {
        const E = f.r6.slice(0, 3), N = f.r6.slice(3);
        const pool = [N + E, `${+E + 1}${N}`, `${E}${+N + 1}`, `${+E - 1}${N}`, `${E}${+N - 1}`, `${E}${+N + 10}`];
        return { type, f, text: `What is the 6-figure grid reference for the <strong>${lc(f)}</strong>?`, answer: f.r6, options: uniq(f.r6, pool), mono: true, fmt: fmt6,
          why: `Along: ${E.slice(0, 2)} + ${E[2]} tenths. Up: ${N.slice(0, 2)} + ${N[2]} tenths. So <span class="ref">${fmt6(f.r6)}</span>.` };
      }
      if (type === "what4" || type === "what6") {
        const six = type === "what6", r = six ? fmt6(f.r6) : f.r4;
        const pool = FEATURES.filter(x => x !== f).map(x => x.name);
        return { type, f, text: six ? `Which feature is at <span class="ref">${r}</span>?` : `Which feature is in square <span class="ref">${r}</span>?`,
          answer: f.name, options: uniq(f.name, pool), why: `The ${lc(f)} is at <span class="ref">${r}</span>.` };
      }
      if (type === "dir") {
        const { a, b, idx } = dirPair();
        const opp = (idx + 4) % 8;
        const pool = [DIRS[opp], DIRS[(idx + 1) % 8], DIRS[(idx + 7) % 8], DIRS[(idx + 2) % 8], DIRS[(idx + 6) % 8]];
        return { type, a, b, text: `Which direction is the <strong>${lc(a)}</strong> from the <strong>${lc(b)}</strong>?`,
          answer: DIRS[idx], options: uniq(DIRS[idx], [DIRS[opp], ...shuffle(pool.slice(1)).slice(0, 2)]),
          why: `Start at the ${lc(b)} and look towards the ${lc(a)}: it's <strong>${DIRS[idx]}</strong>.` };
      }
      const e = rint(E0, E0 + SIZE - 1), n = rint(N0, N0 + SIZE - 1), r = `${e}${n}`;
      return { type, text: `Tap grid square <span class="ref">${r}</span> on the map.`, answer: r, e, n,
        why: `Along to ${e}, up to ${n}. The square is to the <strong>right of</strong> and <strong>above</strong> that corner.` };
    });
  }

  function clearQuizMap() {
    qm.marks.innerHTML = "";
    Object.values(qm.nodes).forEach(n => n.classList.remove("active"));
    hideHover(qm);
  }
  function setScore() {
    qScore.innerHTML = `Score ${score}${streak >= 3 ? `<span class="streak">🔥 ${streak}</span>` : ""}`;
  }

  function showStart() {
    qi = -1;
    clearQuizMap();
    qCount.textContent = "Ready";
    qProgress.style.width = "0";
    qText.textContent = "Choose a quiz";
    qModes.hidden = false;
    setMode(mode);
    qOptions.innerHTML = ""; qFeedback.textContent = ""; qFeedback.className = "feedback";
    qNext.disabled = false; qNext.textContent = "Start quiz";
  }

  function showQuestion() {
    answered = false;
    clearQuizMap();
    qModes.hidden = true; qModeInfo.textContent = "";
    const q = questions[qi];
    qCount.textContent = `${MODES[mode].label} · Question ${qi + 1} of ${TOTAL}`;
    qProgress.style.width = `${(qi / TOTAL) * 100}%`;
    qText.innerHTML = q.text;
    qFeedback.textContent = ""; qFeedback.className = "feedback";
    qOptions.innerHTML = "";
    qNext.disabled = true;
    qNext.textContent = qi === TOTAL - 1 ? "See results" : "Next";
    if (q.type === "ref4" || q.type === "ref6") qm.nodes[q.f.id].classList.add("active");
    if (q.type === "dir") { qm.nodes[q.a.id].classList.add("active"); qm.nodes[q.b.id].classList.add("active"); }
    if (q.type === "tap") {
      qOptions.innerHTML = `<div class="tap-hint">Tap a square on the map</div>`;
      return;
    }
    q.options.forEach((opt, i) => {
      const b = document.createElement("button");
      b.className = "opt" + (q.mono ? " mono" : "");
      b.dataset.value = opt;
      b.innerHTML = `<kbd>${i + 1}</kbd><span>${q.fmt ? q.fmt(opt) : opt}</span>`;
      b.addEventListener("click", () => answer(b));
      qOptions.appendChild(b);
    });
  }

  function finishAnswer(correct, q) {
    answered = true;
    if (correct) { score++; streak++; } else {
      streak = 0;
      missed.push(`${q.text} <span>→ ${q.fmt ? q.fmt(q.answer) : q.answer}</span>`);
    }
    setScore();
    qFeedback.className = "feedback " + (correct ? "good" : "bad");
    qFeedback.innerHTML = (correct ? "Correct! " : "Not quite. ") + `<span>${q.why}</span>`;
    qNext.disabled = false;
  }

  function answer(btn) {
    if (answered) return;
    const q = questions[qi];
    const correct = btn.dataset.value === q.answer;
    [...qOptions.children].forEach(b => {
      b.disabled = true;
      if (b.dataset.value === q.answer) b.classList.add("correct");
    });
    if (!correct) btn.classList.add("wrong");
    if (q.type === "dir") arrowBetween(qm, q.b, q.a);
    else {
      qm.nodes[q.f.id].classList.add("active");
      squareRect(qm, Math.floor(q.f.e), Math.floor(q.f.n), "m-good");
    }
    finishAnswer(correct, q);
  }

  const tapActive = () => qi >= 0 && qi < TOTAL && questions[qi].type === "tap" && !answered;
  qm.svg.addEventListener("pointermove", evt => {
    if (!tapActive()) return;
    const p = svgPoint(qm.svg, evt);
    if (!inMap(p)) { hideHover(qm); return; }
    showHover(qm, p.x, p.y, false);
  });
  qm.svg.addEventListener("pointerleave", () => hideHover(qm));
  qm.svg.addEventListener("click", evt => {
    if (!tapActive()) return;
    const p = svgPoint(qm.svg, evt);
    if (!inMap(p)) return;
    const q = questions[qi];
    const e = Math.floor(fromX(p.x)), n = Math.floor(fromY(p.y));
    const correct = `${e}${n}` === q.answer;
    hideHover(qm);
    if (!correct) squareRect(qm, e, n, "m-bad");
    squareRect(qm, q.e, q.n, "m-good");
    qOptions.innerHTML = `<div class="tap-hint">You tapped <span class="ref">${e}${n}</span></div>`;
    finishAnswer(correct, q);
    if (window.matchMedia("(max-width: 860px)").matches) qFeedback.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  function showResults() {
    clearQuizMap();
    qi = TOTAL;
    qProgress.style.width = "100%";
    qCount.textContent = `${MODES[mode].label} · Finished`;
    const prev = best(mode), isBest = score > prev;
    if (isBest) store.set(bestKey(mode), score);
    const msg = score === 10 ? "Perfect score. You're a grid reference pro! 🏆"
      : score >= 8 ? "Excellent work. Nearly perfect!"
      : score >= 5 ? "Good effort. Check the cheat sheet and try again."
      : "Keep practising. Remember: along the corridor, then up the stairs.";
    qText.innerHTML = `<div class="result-big">${score}/${TOTAL}</div>${msg}` +
      (isBest && prev ? ` <span class="best">New best!</span>` : "");
    qOptions.innerHTML = missed.length
      ? `<span class="label" style="margin-top:8px">Review</span><ul class="review">${missed.map(m => `<li>${m}</li>`).join("")}</ul>`
      : "";
    qFeedback.textContent = ""; qFeedback.className = "feedback";
    qModes.hidden = false; setMode(mode);
    qNext.disabled = false;
    qNext.textContent = "Play again";
    if (score >= 9) confetti();
  }

  function start() {
    questions = makeQuestions(); qi = 0; score = 0; streak = 0; missed = [];
    setScore();
    showQuestion();
  }
  qNext.addEventListener("click", () => {
    if (qi === -1 || qi >= TOTAL) start();
    else if (qi === TOTAL - 1) showResults();
    else { qi++; showQuestion(); }
  });

  // keyboard: 1–4 to answer, Enter for next (only while the quiz is on screen)
  const quizEl = document.querySelector(".quiz");
  document.addEventListener("keydown", e => {
    if (e.target.closest("input, textarea") || e.metaKey || e.ctrlKey || e.altKey) return;
    const r = quizEl.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    if (/^[1-4]$/.test(e.key) && !answered && qi >= 0 && qi < TOTAL) {
      const b = qOptions.querySelectorAll(".opt")[+e.key - 1];
      if (b) { e.preventDefault(); answer(b); }
    } else if (e.key === "Enter" && !qNext.disabled && document.activeElement === document.body) {
      e.preventDefault(); qNext.click();
    }
  });

  showStart();

  // ---------- confetti ----------
  function confetti() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = document.getElementById("confetti"), ctx = c.getContext("2d");
    const dpr = devicePixelRatio || 1;
    c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.scale(dpr, dpr);
    const colors = ["#0071e3", "#af52de", "#ff2d55", "#ff9500", "#34c759", "#5ac8fa"];
    const parts = Array.from({ length: 160 }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .35,
      vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4,
      r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3,
      w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, c: colors[Math.floor(Math.random() * colors.length)],
    }));
    const t0 = performance.now();
    (function frame(t) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach(p => {
        p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      });
      if (t - t0 < 3500) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, innerWidth, innerHeight);
    })(t0);
  }

  // ---------- nav highlight ----------
  const links = [...document.querySelectorAll(".nav-links a")];
  if ("IntersectionObserver" in window) {
    const navIO = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${en.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("section[id]").forEach(s => navIO.observe(s));
  }

  // ---------- reveal on scroll ----------
  const io = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 }) : null;
  document.querySelectorAll(".reveal").forEach(n => io ? io.observe(n) : n.classList.add("in"));
})();
