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

  // ---------- draw a map into an <svg> ----------
  function drawMap(svg, { interactiveFeatures = true } = {}) {
    svg.innerHTML = "";
    const base = el("g", {}, svg);
    el("rect", { x: 0, y: 0, width: 1000, height: 1000, class: "m-land", rx: 6 }, base);

    // hill contours around the viewpoint
    [[60, 45], [100, 75], [140, 105]].forEach(([rx, ry]) =>
      el("ellipse", { cx: 90, cy: 770, rx, ry, class: "m-contour" }, base));

    // woods
    el("path", { class: "m-wood", d: "M60 300 C 120 260, 230 270, 275 320 C 310 370, 270 450, 220 470 C 150 500, 70 470, 50 410 C 35 360, 40 320, 60 300 Z" }, base);
    const trees = [[100,330],[150,310],[205,320],[245,360],[90,390],[145,375],[200,400],[245,420],[110,440],[170,450]];
    trees.forEach(([x, y]) => el("circle", { cx: x, cy: y, r: 9, class: "m-tree" }, base));

    // river + lake
    el("path", { class: "m-river", d: "M500 0 C 520 150, 640 330, 720 480" }, base);
    el("path", { class: "m-river", d: "M800 565 C 840 700, 900 850, 960 1000" }, base);
    el("ellipse", { cx: 760, cy: 520, rx: 80, ry: 55, class: "m-water" }, base);

    // roads
    const roads = [
      "M0 620 C 250 600, 500 660, 1000 600",
      "M380 1000 C 400 700, 330 400, 300 0",
    ];
    roads.forEach(d => el("path", { d, class: "m-road-edge" }, base));
    roads.forEach(d => el("path", { d, class: "m-road" }, base));

    // grid lines and numbers
    const grid = el("g", {}, svg);
    for (let i = 0; i <= SIZE; i++) {
      const p = i * CELL;
      el("line", { x1: p, y1: 0, x2: p, y2: 1000, class: "m-gridline" }, grid);
      el("line", { x1: 0, y1: p, x2: 1000, y2: p, class: "m-gridline" }, grid);
      const et = el("text", { x: p, y: 1040, class: "m-gridnum" }, grid);
      et.textContent = E0 + i;
      const nt = el("text", { x: -32, y: 1000 - p + 9, class: "m-gridnum" }, grid);
      nt.textContent = N0 + i;
    }

    // overlay layer for hover / highlights
    const overlay = el("g", {}, svg);
    const hoverSq = el("rect", { width: CELL, height: CELL, class: "m-hover-sq" }, overlay);
    const crossV = el("line", { y1: 0, y2: 1000, class: "m-cross" }, overlay);
    const crossH = el("line", { x1: 0, x2: 1000, class: "m-cross" }, overlay);
    const marks = el("g", {}, svg);

    // features
    const fLayer = el("g", {}, svg);
    const nodes = {};
    FEATURES.forEach(f => {
      const g = el("g", { class: "m-feature", transform: `translate(${toX(f.e)} ${toY(f.n)})`, "data-id": f.id, tabindex: interactiveFeatures ? 0 : -1, role: "button", "aria-label": f.name }, fLayer);
      if (!interactiveFeatures) g.style.pointerEvents = "none";
      el("circle", { r: 32, class: "halo" }, g);
      const sym = el("g", { class: "sym" }, g);
      sym.innerHTML = ICONS[f.id];
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
    const e = fromX(x), n = fromY(y);
    m.hoverSq.setAttribute("x", Math.floor(x / CELL) * CELL);
    m.hoverSq.setAttribute("y", (Math.ceil(y / CELL) - 1) * CELL);
    m.hoverSq.style.opacity = 1;
    if (withCross) {
      m.crossV.setAttribute("x1", x); m.crossV.setAttribute("x2", x);
      m.crossH.setAttribute("y1", y); m.crossH.setAttribute("y2", y);
      m.crossV.style.opacity = m.crossH.style.opacity = .6;
    }
    return { e, n };
  }
  function hideHover(m) {
    m.hoverSq.style.opacity = 0;
    m.crossV.style.opacity = m.crossH.style.opacity = 0;
  }
  function squareRect(m, e, n, cls) {
    return el("rect", { x: toX(e), y: toY(n + 1), width: CELL, height: CELL, class: `m-flash ${cls}` }, m.marks);
  }
  function pin(m, x, y) {
    const g = el("g", { class: "m-pin", transform: `translate(${x} ${y})` }, m.marks);
    el("circle", { r: 14, class: "pulse" }, g);
    el("circle", { r: 10 }, g);
    return g;
  }

  // ---------- Learn: 6-figure diagram ----------
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
    const label = (x, y, txt, cls = "d-num") => { const n = el("text", { x, y, class: cls }, svg); n.textContent = txt; };
    label(x0, y0 + s + 28, "24"); label(x0 + s, y0 + s + 28, "25");
    label(x0 - 26, y0 + s + 5, "45"); label(x0 - 26, y0 + 5, "46");
    label(px, y0 + s + 16, "3", "d-label"); label(x0 + 10, py - 6, "7", "d-label");
  })();

  // ---------- Explore ----------
  const ex = drawMap(document.getElementById("exploreMap"));
  const out4 = document.getElementById("out4");
  const out6 = document.getElementById("out6");
  const info = document.getElementById("featureInfo");
  let activeFeature = null;

  function readout(e, n) {
    out4.textContent = ref4(e, n);
    out6.textContent = fmt6(ref6(e, n));
  }
  ex.svg.addEventListener("pointermove", evt => {
    const p = svgPoint(ex.svg, evt);
    if (!inMap(p)) { hideHover(ex); return; }
    const { e, n } = showHover(ex, p.x, p.y);
    readout(e, n);
  });
  ex.svg.addEventListener("pointerdown", evt => {
    const p = svgPoint(ex.svg, evt);
    if (!inMap(p)) return;
    const { e, n } = showHover(ex, p.x, p.y);
    readout(e, n);
  });
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

  // legend
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
      here = FEATURES.find(f => f.r6 === v);
    } else {
      here = FEATURES.filter(f => f.r4 === v).map(f => f.name).join(", ");
    }
    readout(v.length === 6 ? e + 0.05 : fe + 0.5, v.length === 6 ? n + 0.05 : fn + 0.5);
    findMsg.innerHTML = here
      ? `Found: <strong>${typeof here === "string" ? here : here.name}</strong>`
      : v.length === 4 ? `Square <span class="ref">${v}</span> is highlighted.` : `Point <span class="ref">${fmt6(v)}</span> is pinned.`;
  });

  // ---------- Quiz ----------
  const qm = drawMap(document.getElementById("quizMap"), { interactiveFeatures: false });
  const qCount = document.getElementById("qCount");
  const qScore = document.getElementById("qScore");
  const qProgress = document.getElementById("qProgress");
  const qText = document.getElementById("qText");
  const qOptions = document.getElementById("qOptions");
  const qFeedback = document.getElementById("qFeedback");
  const qNext = document.getElementById("qNext");
  const TOTAL = 10;
  let questions = [], qi = -1, score = 0, answered = false;

  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const uniq = (correct, pool, n = 4) => {
    const out = [correct];
    for (const p of shuffle(pool)) { if (out.length >= n) break; if (!out.includes(p)) out.push(p); }
    return shuffle(out);
  };

  function makeQuestions() {
    const types = shuffle(["ref4", "ref4", "ref4", "ref6", "ref6", "ref6", "what", "what", "tap", "tap"]);
    const feats = shuffle([...FEATURES]);
    let fi = 0;
    return types.map(type => {
      const f = feats[fi++ % feats.length];
      if (type === "ref4") {
        const e = Math.floor(f.e), n = Math.floor(f.n);
        const pool = [`${n}${e}`, `${e + 1}${n}`, `${e}${n + 1}`, `${e - 1}${n}`, `${e}${n - 1}`, `${e + 1}${n + 1}`];
        return { type, f, text: `What is the 4-figure grid reference for the <strong>${f.name.toLowerCase()}</strong>?`, answer: f.r4, options: uniq(f.r4, pool), mono: true,
          why: `Go along to ${e}, then up to ${n}: <span class="ref">${f.r4}</span>.` };
      }
      if (type === "ref6") {
        const E = f.r6.slice(0, 3), N = f.r6.slice(3);
        const pool = [N + E, `${+E + 1}${N}`, `${E}${+N + 1}`, `${+E - 1}${N}`, `${E}${+N - 1}`, `${E}${+N + 10}`];
        return { type, f, text: `What is the 6-figure grid reference for the <strong>${f.name.toLowerCase()}</strong>?`, answer: f.r6, options: uniq(f.r6, pool).map(String), mono: true, fmt: fmt6,
          why: `Along: ${E.slice(0, 2)} + ${E[2]} tenths. Up: ${N.slice(0, 2)} + ${N[2]} tenths. So <span class="ref">${fmt6(f.r6)}</span>.` };
      }
      if (type === "what") {
        const pool = FEATURES.filter(x => x !== f).map(x => x.name);
        return { type, f, text: `Which feature is at <span class="ref">${fmt6(f.r6)}</span>?`, answer: f.name, options: uniq(f.name, pool),
          why: `The ${f.name.toLowerCase()} is at <span class="ref">${fmt6(f.r6)}</span>.` };
      }
      // tap
      const e = rint(E0, E0 + SIZE - 1), n = rint(N0, N0 + SIZE - 1);
      const r = `${e}${n}`;
      return { type, text: `Tap grid square <span class="ref">${r}</span> on the map.`, answer: r, e, n,
        why: `Along to ${e}, up to ${n}. The square sits to the <strong>right of</strong> and <strong>above</strong> that corner.` };
    });
  }

  function clearQuizMap() {
    qm.marks.innerHTML = "";
    Object.values(qm.nodes).forEach(n => n.classList.remove("active"));
    hideHover(qm);
  }

  function showQuestion() {
    answered = false;
    clearQuizMap();
    const q = questions[qi];
    qCount.textContent = `Question ${qi + 1} of ${TOTAL}`;
    qProgress.style.width = `${(qi / TOTAL) * 100}%`;
    qText.innerHTML = q.text;
    qFeedback.textContent = ""; qFeedback.className = "feedback";
    qOptions.innerHTML = "";
    qNext.disabled = true;
    qNext.textContent = qi === TOTAL - 1 ? "See results" : "Next";
    if (q.type === "ref4" || q.type === "ref6") qm.nodes[q.f.id].classList.add("active");
    if (q.type === "tap") {
      qOptions.innerHTML = `<div class="tap-hint">Tap a square on the map</div>`;
      return;
    }
    q.options.forEach(opt => {
      const b = document.createElement("button");
      b.className = "opt" + (q.mono ? " mono" : "");
      b.textContent = q.fmt ? q.fmt(opt) : opt;
      b.addEventListener("click", () => answer(opt, b));
      qOptions.appendChild(b);
    });
  }

  function finishAnswer(correct, q) {
    answered = true;
    if (correct) score++;
    qScore.textContent = `Score ${score}`;
    qFeedback.className = "feedback " + (correct ? "good" : "bad");
    qFeedback.innerHTML = (correct ? "Correct! " : "Not quite. ") + `<span>${q.why}</span>`;
    qNext.disabled = false;
    qNext.focus({ preventScroll: true });
  }

  function answer(opt, btn) {
    if (answered) return;
    const q = questions[qi];
    const correct = opt === q.answer;
    [...qOptions.children].forEach(b => {
      b.disabled = true;
      const val = q.fmt ? b.textContent.replace(" ", "") : b.textContent;
      if (val === q.answer) b.classList.add("correct");
    });
    if (!correct) btn.classList.add("wrong");
    if (q.type === "what") { qm.nodes[q.f.id].classList.add("active"); squareRect(qm, Math.floor(q.f.e), Math.floor(q.f.n), "m-good"); }
    else squareRect(qm, Math.floor(q.f.e), Math.floor(q.f.n), "m-good");
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
  });

  function showResults() {
    clearQuizMap();
    qProgress.style.width = "100%";
    qCount.textContent = "Finished";
    const msg = score === 10 ? "Perfect score. You're a grid reference pro! 🏆"
      : score >= 8 ? "Excellent work. Nearly perfect!"
      : score >= 5 ? "Good effort. Check the cheat sheet and try again."
      : "Keep practising. Remember: along the corridor, then up the stairs.";
    qText.innerHTML = `<div class="result-big">${score}/${TOTAL}</div>${msg}`;
    qOptions.innerHTML = "";
    qFeedback.textContent = ""; qFeedback.className = "feedback";
    qNext.disabled = false;
    qNext.textContent = "Play again";
  }

  qNext.addEventListener("click", () => {
    if (qi === -1 || qi >= TOTAL) {
      questions = makeQuestions(); qi = 0; score = 0;
      qScore.textContent = "Score 0";
      showQuestion();
    } else if (qi === TOTAL - 1) {
      qi = TOTAL; showResults();
    } else {
      qi++; showQuestion();
    }
  });

  // ---------- reveal on scroll ----------
  const io = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 }) : null;
  document.querySelectorAll(".reveal").forEach(n => io ? io.observe(n) : n.classList.add("in"));
})();
