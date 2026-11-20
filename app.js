/* Grid References — maps, explorer, teaching tools and quiz */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const CELL = 100; // svg units per grid square; every map is 10 x 10 squares

  // ---------- small helpers ----------
  const $ = id => document.getElementById(id);
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
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const uniq = (correct, pool, n = 4) => {
    const out = [correct];
    for (const p of shuffle([...pool])) { if (out.length >= n) break; if (p && !out.includes(p)) out.push(p); }
    return shuffle(out);
  };
  const mulberry = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const pad2 = x => String(((x % 100) + 100) % 100).padStart(2, "0");
  const fmt6 = r => `${r.slice(0, 3)} ${r.slice(3)}`;
  const X = u => u * CELL, Y = v => (10 - v) * CELL;          // local grid units -> svg
  const U = x => x / CELL, V = y => 10 - y / CELL;            // svg -> local grid units

  // Grid reference for a point (u, v) in local grid units (0–10) on a map
  function refs(map, u, v) {
    u = Math.min(Math.max(u, 0), 9.9999); v = Math.min(Math.max(v, 0), 9.9999);
    const i = Math.floor(u + 1e-9), j = Math.floor(v + 1e-9);
    const te = Math.min(9, Math.floor((u - i) * 10 + 1e-6)), tn = Math.min(9, Math.floor((v - j) * 10 + 1e-6));
    const E = pad2(map.e0 + i), N = pad2(map.n0 + j);
    return { i, j, te, tn, E, N, r4: E + N, r6: `${E}${te}${N}${tn}` };
  }
  // Parse "2445" or "243457" on a map into local units; null if it's not on this map
  function parseRef(map, s) {
    const d = s.replace(/\s/g, "");
    if (!/^\d{4}$|^\d{6}$/.test(d)) return { error: "Type 4 or 6 digits." };
    const six = d.length === 6;
    const EE = d.slice(0, 2), NN = six ? d.slice(3, 5) : d.slice(2, 4);
    const i = [...Array(10).keys()].find(k => pad2(map.e0 + k) === EE);
    const j = [...Array(10).keys()].find(k => pad2(map.n0 + k) === NN);
    if (i === undefined || j === undefined) return { error: "off" };
    if (!six) return { six, i, j, u: i + .5, v: j + .5, r: d };
    const te = +d[2], tn = +d[5];
    return { six, i, j, te, tn, u: i + te / 10 + .05, v: j + tn / 10 + .05, r: d };
  }

  // ---------- map symbols (drawn centred on 0,0, about 40 units wide) ----------
  const circ = c => `<circle r="20" fill="${c}"/>`;
  const sq = c => `<rect x="-20" y="-20" width="40" height="40" rx="10" fill="${c}"/>`;
  const txt = (t, s = 18) => `<text y="${(s * .36).toFixed(1)}" text-anchor="middle" font-size="${s}" font-weight="800" fill="#fff" font-family="-apple-system,Helvetica,Arial">${t}</text>`;
  const ICONS = {
    church: `<circle r="19" fill="#1d1d1f" stroke="#fff" stroke-width="2.5"/><path d="M0-12v24M-8-4h16" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
    school: sq("#ff9500") + `<path d="M-11 9V-2L0-11 11-2v11z" fill="#fff"/>`,
    windmill: circ("#5856d6") + `<path d="M-11-11L11 11M11-11L-11 11" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle r="4" fill="#fff"/>`,
    parking: sq("#0071e3") + txt("P", 28),
    farm: sq("#a2845e") + txt("Fm", 18),
    camp: circ("#34c759") + `<path d="M0-11L13 10H-13z" fill="#fff"/><path d="M0 0L5 10H-5z" fill="#34c759"/>`,
    post: circ("#ff3b30") + `<rect x="-11" y="-7" width="22" height="15" rx="2" fill="#fff"/><path d="M-11-6L0 2 11-6" stroke="#ff3b30" stroke-width="2.5" fill="none"/>`,
    picnic: circ("#30b0c7") + `<path d="M-12-4h24M-8 11l5-15M8 11L3-4M-12 4h24" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`,
    view: circ("#af52de") + `<path d="M-12 6a12 12 0 0 1 24 0z" fill="#fff"/><path d="M0-6v-6M-9-3l-4-4M9-3l4-4" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
    pub: sq("#8e5b2e") + txt("PH", 17),
    station: circ("#ff2d55") + `<rect x="-8" y="-11" width="16" height="17" rx="4" fill="#fff"/><path d="M-6 12l3-5M6 12L3 7" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="-3" r="3" fill="#ff2d55"/>`,
    lighthouse: circ("#ff9f0a") + `<path d="M-5 12L-3-7H3L5 12Z" fill="#fff"/><path d="M-12-13L-5-9M12-13L5-9" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`,
    harbour: circ("#0a84ff") + `<path d="M0-8v19M-7-3h14M-11 3a11 9 0 0 0 22 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/><circle cy="-11" r="3" fill="none" stroke="#fff" stroke-width="2.5"/>`,
    caravan: sq("#1c7ed6") + `<rect x="-14" y="-9" width="22" height="14" rx="4" fill="#fff"/><circle cx="-5" cy="8" r="3.5" fill="#fff"/><path d="M8 3h6" stroke="#fff" stroke-width="3"/>`,
    cafe: circ("#d4793a") + `<path d="M-10-5h16v6a8 8 0 0 1-16 0z" fill="#fff"/><path d="M6-2a4 4 0 0 1 0 8" stroke="#fff" stroke-width="2.5" fill="none"/>`,
    golf: circ("#248a3d") + `<path d="M-4 12V-12l12 5-12 5" stroke="#fff" stroke-width="3" fill="#fff" stroke-linejoin="round"/>`,
    info: circ("#2c6fbb") + txt("i", 26),
    hospital: sq("#ff3b30") + txt("H", 26),
    museum: sq("#bf5af2") + `<path d="M-12-5L0-12 12-5zM-12 11h24" stroke="#fff" stroke-width="2.5" fill="#fff" stroke-linejoin="round"/><path d="M-8-2v10M0-2v10M8-2v10" stroke="#fff" stroke-width="3"/>`,
    police: sq("#1f3a93") + txt("Pol", 14),
    library: sq("#ac8e68") + `<path d="M-12-9h9a3 3 0 0 1 3 3v16a3 3 0 0 0-3-2h-9zM12-9H3a3 3 0 0 0-3 3v16a3 3 0 0 1 3-2h9z" fill="#fff"/>`,
    bus: sq("#ff9f0a") + `<rect x="-10" y="-13" width="20" height="21" rx="4" fill="#fff"/><rect x="-7" y="-9" width="14" height="7" rx="1" fill="#ff9f0a"/><circle cx="-6" cy="11" r="2.5" fill="#fff"/><circle cx="6" cy="11" r="2.5" fill="#fff"/>`,
    park: circ("#248a3d") + `<circle cy="-4" r="9" fill="#fff"/><path d="M0 4v9" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`,
    roundabout: circ("#636366") + `<circle r="9" fill="none" stroke="#fff" stroke-width="3"/><path d="M9-6l0 7-6-3" fill="#fff"/>`,
    trig: circ("#3a3a3c") + `<path d="M0-12L12 9H-12z" fill="#fff"/><circle cy="2" r="3" fill="#3a3a3c"/>`,
    cairn: circ("#8e8e93") + `<ellipse cy="7" rx="10" ry="4" fill="#fff"/><ellipse cy="0" rx="7" ry="3.5" fill="#fff"/><ellipse cy="-7" rx="4" ry="3" fill="#fff"/>`,
    waterfall: circ("#0a84ff") + `<path d="M-6-11v13M0-11v16M6-11v13" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M-11 9q5.5-4 11 0t11 0" stroke="#fff" stroke-width="2.5" fill="none"/>`,
    hostel: sq("#ff375f") + `<path d="M-12 10V-2L0-12 12-2v12z" fill="#fff"/><path d="M-4 10V2h8v8" fill="#ff375f"/>`,
  };

  // sample points along an svg path (for keeping houses off roads, cliff ticks, etc.)
  function samplePath(p, step = 15, from = 0, to = 1) {
    const L = p.getTotalLength(), pts = [];
    for (let s = L * from; s <= L * to; s += step) { const q = p.getPointAtLength(s); pts.push([q.x, q.y, s]); }
    return pts;
  }
  function blob(cx, cy, r, phase, sx = 1, sy = 1) {
    const pts = [];
    for (let k = 0; k < 64; k++) {
      const a = k / 64 * Math.PI * 2;
      const rr = r * (1 + .1 * Math.sin(3 * a + phase) + .06 * Math.sin(5 * a + phase * 2));
      pts.push(`${(cx + Math.cos(a) * rr * sx).toFixed(1)} ${(cy + Math.sin(a) * rr * sy).toFixed(1)}`);
    }
    return `M${pts.join("L")}Z`;
  }
  function trees(add, list) { list.forEach(([x, y]) => add("circle", { cx: x, cy: y, r: 9, class: "m-tree" })); }
  function roads(add, ds) {
    ds.forEach(d => add("path", { d, class: "m-road-edge" }));
    return ds.map(d => add("path", { d, class: "m-road" }));
  }

  // ---------- the maps ----------
  const MAPS = [
    {
      id: "village", name: "Village", blurb: "Roads, woods and a river", e0: 20, n0: 40,
      features: [
        ["church", "Church", 4.3, 5.7], ["school", "School", 1.6, 8.2], ["windmill", "Windmill", 7.2, 7.6],
        ["parking", "Car park", 5.4, 2.9], ["farm", "Farm", 2.8, 2.4], ["camp", "Campsite", 2.4, 0.8],
        ["post", "Post office", 8.2, 8.6], ["picnic", "Picnic site", 7.3, 1.8], ["view", "Viewpoint", 0.9, 2.3],
        ["pub", "Pub", 5.8, 5.2], ["station", "Train station", 9.4, 2.6],
      ],
      draw(add) {
        [[60, 45], [100, 75], [140, 105]].forEach(([rx, ry]) => add("ellipse", { cx: 90, cy: 770, rx, ry, class: "m-contour" }));
        add("path", { class: "m-wood", d: "M60 300 C 120 260, 230 270, 275 320 C 310 370, 270 450, 220 470 C 150 500, 70 470, 50 410 C 35 360, 40 320, 60 300 Z" });
        trees(add, [[100,330],[150,310],[205,320],[245,360],[90,390],[145,375],[200,400],[245,420],[110,440],[170,450]]);
        add("path", { class: "m-river", d: "M500 0 C 520 150, 640 330, 720 480" });
        add("path", { class: "m-river", d: "M800 565 C 840 700, 900 850, 960 1000" });
        add("ellipse", { cx: 760, cy: 520, rx: 80, ry: 55, class: "m-water" });
        roads(add, ["M0 620 C 250 600, 500 660, 1000 600", "M380 1000 C 400 700, 330 400, 300 0"]);
      },
    },
    {
      id: "coast", name: "Coast", blurb: "Cliffs, beach and harbour", e0: 61, n0: 23,
      features: [
        ["church", "Church", 0.9, 8.3], ["view", "Viewpoint", 4.6, 9.2], ["lighthouse", "Lighthouse", 5.8, 7.4],
        ["info", "Information centre", 3.3, 7.1], ["parking", "Car park", 3.3, 6.2], ["harbour", "Harbour", 5.4, 4.8],
        ["caravan", "Caravan park", 4.0, 2.6], ["cafe", "Beach café", 4.9, 1.3], ["golf", "Golf course", 1.8, 1.4],
        ["post", "Post office", 1.2, 3.6],
      ],
      draw(add) {
        add("ellipse", { cx: 180, cy: 860, rx: 120, ry: 75, class: "m-park" });
        add("path", { d: "M600 500 C 520 620, 640 800, 560 1000", class: "m-sand" });
        const coast = "M620 0 C 560 200, 700 350, 600 500 C 520 620, 640 800, 560 1000";
        add("path", { d: coast + " L1000 1000 L1000 0Z", class: "m-sea" });
        add("path", { d: coast, class: "m-coastline" });
        const cliff = add("path", { d: "M620 0 C 560 200, 700 350, 600 500", class: "m-coastline" });
        const pts = samplePath(cliff, 24, .02, .92);
        pts.forEach(([x, y, s]) => {
          const q = cliff.getPointAtLength(s + 1), tx = q.x - x, ty = q.y - y, l = Math.hypot(tx, ty) || 1;
          const nx = -ty / l, ny = tx / l, ux = tx / l, uy = ty / l;
          add("path", { class: "m-cliff", d: `M${x - ux * 7} ${y - uy * 7}L${x + nx * 20} ${y + ny * 20}L${x + ux * 7} ${y + uy * 7}Z` });
        });
        [[780, 180], [880, 330], [760, 640], [900, 760], [780, 900]].forEach(([x, y]) =>
          add("path", { d: `M${x} ${y} q 15 -12 30 0 t 30 0`, class: "m-wave" }));
        const t = add("text", { x: 850, y: 520, class: "m-sea-label" }); t.textContent = "SEA";
        add("path", { d: "M600 494 L 664 482", class: "m-pier" });
        add("path", { d: "M598 548 L 660 562", class: "m-pier" });
        roads(add, ["M0 450 C 200 430, 380 520, 540 520", "M150 0 C 200 300, 300 600, 380 1000"]);
      },
    },
    {
      id: "town", name: "Town", blurb: "Streets, railway and a park", e0: 34, n0: 72,
      features: [
        ["roundabout", "Roundabout", 4.3, 4.7], ["station", "Train station", 6.1, 8.2], ["hospital", "Hospital", 1.7, 7.4],
        ["museum", "Museum", 2.9, 2.6], ["police", "Police station", 8.8, 5.3], ["library", "Library", 5.6, 6.2],
        ["school", "School", 2.2, 1.6], ["bus", "Bus station", 5.2, 4.1], ["church", "Church", 7.2, 8.8],
        ["park", "Park", 7.4, 1.4], ["post", "Post office", 1.1, 4.0],
      ],
      draw(add, map) {
        const blocks = add("g", {});
        const park = { x: 580, y: 760, w: 320, h: 200 };
        add("rect", { x: park.x, y: park.y, width: park.w, height: park.h, rx: 30, class: "m-park" });
        trees(add, [[620, 800], [660, 920], [820, 800], [860, 900], [700, 790]]);
        const river = add("path", { d: "M0 300 C 300 250, 600 650, 1000 700", class: "m-river" });
        const rail = add("path", { d: "M0 160 C 300 140, 700 220, 1000 200", class: "m-rail" });
        add("path", { d: "M0 160 C 300 140, 700 220, 1000 200", class: "m-rail-dash" });
        const rs = roads(add, ["M0 530 H1000", "M430 0 V1000", "M0 900 L 405 552"]);
        add("circle", { cx: 430, cy: 530, r: 34, class: "m-road-edge" });
        add("circle", { cx: 430, cy: 530, r: 34, class: "m-road" });
        // houses: fill the gaps, keeping clear of roads, river, railway, park and symbols
        const avoid = [river, rail, ...rs].flatMap(p => samplePath(p, 14));
        map.features.forEach(f => avoid.push([X(f.u), Y(f.v)]));
        const rnd = mulberry(7);
        for (let gx = 20; gx < 1000; gx += 58) for (let gy = 20; gy < 1000; gy += 58) {
          const x = gx + (rnd() - .5) * 14, y = gy + (rnd() - .5) * 14;
          if (x > park.x - 30 && x < park.x + park.w + 30 && y > park.y - 30 && y < park.y + park.h + 30) continue;
          if (avoid.some(([ax, ay]) => (ax - x) ** 2 + (ay - y) ** 2 < 46 * 46)) continue;
          if (rnd() < .18) continue;
          const w = 26 + rnd() * 18, h = 22 + rnd() * 16;
          el("rect", { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 3, class: "m-built", transform: `rotate(${((rnd() - .5) * 16).toFixed(1)} ${x} ${y})` }, blocks);
        }
      },
    },
    {
      id: "hills", name: "Hills", blurb: "Contours, summits and streams", e0: 82, n0: 6,
      features: [
        ["trig", "Trig point (summit)", 3.4, 6.6], ["cairn", "Cairn", 7.6, 7.8], ["waterfall", "Waterfall", 5.6, 4.9],
        ["hostel", "Youth hostel", 5.9, 2.5], ["parking", "Car park", 1.3, 2.4], ["view", "Viewpoint", 5.3, 9.0],
        ["farm", "Farm", 8.4, 5.2], ["camp", "Campsite", 8.6, 1.2], ["pub", "Pub", 2.4, 3.1],
      ],
      draw(add) {
        add("path", { class: "m-wood", d: "M70 430 C 120 400, 200 410, 210 470 C 220 530, 170 570, 110 560 C 60 550, 40 470, 70 430Z" });
        trees(add, [[100, 450], [150, 440], [180, 480], [120, 500], [160, 530], [90, 530]]);
        [45, 95, 145, 195, 245, 300, 355].forEach((r, k) =>
          add("path", { d: blob(340, 340, r, 1.3), class: "m-contour" + (k % 2 ? "" : " idx") }));
        [40, 85, 130, 180].forEach((r, k) =>
          add("path", { d: blob(760, 220, r, 4.1, 1.2, .9), class: "m-contour" + (k % 2 ? "" : " idx") }));
        [[340, 640, "300"], [340, 540, "400"], [340, 440, "500"], [760, 375, "400"]].forEach(([x, y, t]) => {
          const n = add("text", { x, y, class: "m-height-c" }); n.textContent = t;
        });
        add("ellipse", { cx: 780, cy: 720, rx: 110, ry: 60, class: "m-water" });
        add("path", { d: "M470 120 C 520 300, 580 400, 560 510 S 640 650, 690 690", class: "m-stream" });
        add("path", { d: "M130 760 C 200 600, 260 450, 340 340", class: "m-footpath" });
        add("path", { d: "M340 340 C 400 250, 470 160, 530 100", class: "m-footpath" });
        add("path", { d: "M340 340 C 500 300, 650 260, 760 220", class: "m-footpath" });
        roads(add, ["M0 850 C 200 820, 300 700, 450 760 S 700 980, 1000 950"]);
        [[366, 300, "612"], [792, 212, "538"], [790, 802, "205"]].forEach(([x, y, t]) => {
          const n = add("text", { x, y, class: "m-height" }); n.textContent = `·${t}`;
        });
      },
    },
    {
      id: "tricky", name: "Tricky numbers", blurb: "The grid crosses 99 → 00", e0: 95, n0: 95,
      features: [
        ["church", "Church", 4.6, 5.3], ["school", "School", 5.3, 4.7], ["windmill", "Windmill", 2.2, 9.4],
        ["farm", "Farm", 7.8, 2.3], ["station", "Train station", 8.5, 7.4], ["pub", "Pub", 2.6, 2.1],
        ["parking", "Car park", 6.1, 6.0], ["post", "Post office", 5.7, 1.4], ["view", "Viewpoint", 9.1, 4.0],
        ["picnic", "Picnic site", 3.0, 4.4],
      ],
      draw(add) {
        add("path", { class: "m-wood", d: "M110 420 C 180 380, 260 420, 250 500 C 245 580, 200 660, 140 640 C 80 620, 70 470, 110 420Z" });
        trees(add, [[130, 450], [190, 440], [220, 500], [150, 520], [200, 580], [130, 590]]);
        add("ellipse", { cx: 420, cy: 720, rx: 70, ry: 45, class: "m-water" });
        add("path", { d: "M400 765 C 380 850, 420 920, 400 1000", class: "m-stream" });
        add("path", { d: "M0 120 C 400 160, 700 300, 1000 240", class: "m-rail" });
        add("path", { d: "M0 120 C 400 160, 700 300, 1000 240", class: "m-rail-dash" });
        roads(add, ["M0 300 C 300 260, 650 360, 1000 320", "M700 0 C 660 300, 760 650, 680 1000"]);
      },
    },
  ];
  MAPS.forEach(m => {
    m.features = m.features.map(([icon, name, u, v]) => ({ id: icon, icon, name, u, v }));
    m.features.forEach(f => Object.assign(f, refs(m, f.u, f.v)));
  });
  const lc = f => f.name.toLowerCase().replace(/ \(.*\)/, "");

  const DIRS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
  const ABBR = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const bearing = (a, b) => (Math.atan2(a.u - b.u, a.v - b.v) * 180 / Math.PI + 360) % 360;

  // ---------- draw a map into an <svg> ----------
  function drawMap(svg, map, { interactiveFeatures = true } = {}) {
    svg.innerHTML = "";
    const clipId = `${svg.id}-clip`;
    const defs = el("defs", {}, svg);
    el("rect", { x: 0, y: 0, width: 1000, height: 1000, rx: 6 }, el("clipPath", { id: clipId }, defs));
    const base = el("g", { "clip-path": `url(#${clipId})` }, svg);
    el("rect", { x: 0, y: 0, width: 1000, height: 1000, class: "m-land" }, base);
    map.draw((tag, attrs) => el(tag, attrs, base), map);

    const grid = el("g", {}, svg);
    for (let i = 0; i <= 10; i++) {
      const p = i * CELL;
      el("line", { x1: p, y1: 0, x2: p, y2: 1000, class: "m-gridline" }, grid);
      el("line", { x1: 0, y1: p, x2: 1000, y2: p, class: "m-gridline" }, grid);
      el("text", { x: p, y: 1040, class: "m-gridnum" }, grid).textContent = pad2(map.e0 + i);
      el("text", { x: -32, y: 1000 - p + 9, class: "m-gridnum" }, grid).textContent = pad2(map.n0 + i);
    }

    const overlay = el("g", { class: "m-overlay" }, svg);
    const hoverSq = el("rect", { width: CELL, height: CELL, class: "m-hover-sq" }, overlay);
    const crossV = el("line", { y1: 0, y2: 1000, class: "m-cross" }, overlay);
    const crossH = el("line", { x1: 0, x2: 1000, class: "m-cross" }, overlay);
    const marks = el("g", { class: "m-marks" }, svg);

    const fLayer = el("g", {}, svg);
    const nodes = {};
    map.features.forEach(f => {
      const g = el("g", { class: "m-feature", transform: `translate(${X(f.u)} ${Y(f.v)})`, "data-id": f.id }, fLayer);
      if (interactiveFeatures) { g.setAttribute("tabindex", 0); g.setAttribute("role", "button"); g.setAttribute("aria-label", f.name); }
      else g.style.pointerEvents = "none";
      el("circle", { r: 32, class: "halo" }, g);
      el("g", { class: "sym" }, g).innerHTML = ICONS[f.icon];
      el("circle", { r: 28, class: "hit" }, g);
      nodes[f.id] = g;
    });
    const top = el("g", { class: "m-top" }, svg);
    return { svg, map, hoverSq, crossV, crossH, marks, nodes, top };
  }

  function svgPoint(svg, evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  const inMap = p => p.x >= 0 && p.x < 1000 && p.y > 0 && p.y <= 1000;
  function showHover(m, u, v, withCross = true) {
    m.hoverSq.setAttribute("x", Math.floor(u) * CELL);
    m.hoverSq.setAttribute("y", (9 - Math.floor(v)) * CELL);
    m.hoverSq.style.opacity = 1;
    if (withCross) {
      m.crossV.setAttribute("x1", X(u)); m.crossV.setAttribute("x2", X(u));
      m.crossH.setAttribute("y1", Y(v)); m.crossH.setAttribute("y2", Y(v));
      m.crossV.style.opacity = m.crossH.style.opacity = .6;
    }
  }
  function hideHover(m) {
    m.hoverSq.style.opacity = 0;
    m.crossV.style.opacity = m.crossH.style.opacity = 0;
  }
  const squareRect = (m, i, j, cls) =>
    el("rect", { x: i * CELL, y: (9 - j) * CELL, width: CELL, height: CELL, class: `m-flash ${cls}` }, m.marks);
  function pin(m, u, v) {
    const g = el("g", { class: "m-pin", transform: `translate(${X(u)} ${Y(v)})` }, m.marks);
    el("circle", { r: 14, class: "pulse" }, g);
    el("circle", { r: 10 }, g);
  }
  function callout(m, u, v, text) {
    m.top.innerHTML = "";
    if (!text) return;
    const w = text.length > 5 ? 200 : 130;
    let x = Math.min(Math.max(X(u), w / 2 + 6), 1000 - w / 2 - 6);
    let y = Y(v) - 62; if (y < 34) y = Y(v) + 62;
    const g = el("g", { class: "m-callout", transform: `translate(${x} ${y})` }, m.top);
    el("rect", { x: -w / 2, y: -28, width: w, height: 56, rx: 28 }, g);
    el("text", { y: 12 }, g).textContent = text;
  }
  function arrowBetween(m, from, to) {
    const x1 = X(from.u), y1 = Y(from.v), x2 = X(to.u), y2 = Y(to.v);
    const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const sx = x1 + ux * 36, sy = y1 + uy * 36, ex = x2 - ux * 40, ey = y2 - uy * 40;
    el("line", { x1: sx, y1: sy, x2: ex, y2: ey, stroke: "var(--accent)", "stroke-width": 6, "stroke-linecap": "round", "stroke-dasharray": "2 14", class: "m-flash" }, m.marks);
    el("path", { d: "M0 0L-26-14L-26 14Z", fill: "var(--accent)", transform: `translate(${ex} ${ey}) rotate(${Math.atan2(uy, ux) * 180 / Math.PI})`, class: "m-flash" }, m.marks);
  }

  // ---------- Learn diagrams ----------
  (function tenthsDiagram() {
    const svg = $("tenthsDiagram");
    const x0 = 70, y0 = 20, s = 130, t = s / 10;
    el("rect", { x: x0, y: y0, width: s, height: s, class: "d-square" }, svg);
    for (let i = 1; i < 10; i++) {
      el("line", { x1: x0 + i * t, y1: y0, x2: x0 + i * t, y2: y0 + s, class: "d-tick" }, svg);
      el("line", { x1: x0, y1: y0 + i * t, x2: x0 + s, y2: y0 + i * t, class: "d-tick" }, svg);
    }
    el("path", { d: `M${x0} ${y0 - 10}v${s + 20}M${x0 + s} ${y0 - 10}v${s + 20}M${x0 - 10} ${y0}h${s + 20}M${x0 - 10} ${y0 + s}h${s + 20}` }, el("g", { class: "d-grid" }, svg));
    const px = x0 + 3 * t, py = y0 + s - 7 * t;
    el("path", { d: `M${px} ${y0 + s}V${py}M${x0} ${py}H${px}`, class: "d-guide" }, svg);
    el("circle", { cx: px, cy: py, r: 6, class: "d-dot" }, svg);
    const label = (x, y, txt, cls = "d-num") => { el("text", { x, y, class: cls }, svg).textContent = txt; };
    label(x0, y0 + s + 28, "24"); label(x0 + s, y0 + s + 28, "25");
    label(x0 - 26, y0 + s + 5, "45"); label(x0 - 26, y0 + 5, "46");
    label(px, y0 + s + 16, "3", "d-label"); label(x0 + 10, py - 6, "7", "d-label");
  })();
  (function compassDiagram() {
    const svg = $("compassDiagram");
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

  // ---------- state ----------
  let map = MAPS.find(m => m.id === store.get("gr-map")) || MAPS[0];
  let ex, qm;                       // drawn explore / quiz maps
  let pinPt = null;                 // {u, v} the explore pin
  let hidden = false, revealed = false;
  let challenge = null;

  // ---------- map picker ----------
  const pickers = [...document.querySelectorAll("[data-picker]")];
  function renderPickers() {
    pickers.forEach(p => {
      p.innerHTML = "";
      MAPS.forEach(m => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "map-chip"; b.setAttribute("role", "radio");
        b.setAttribute("aria-checked", m === map);
        b.innerHTML = `<strong>${m.name}</strong><span>${m.blurb}</span>`;
        b.addEventListener("click", () => setMap(m));
        p.appendChild(b);
      });
    });
  }
  function setMap(m) {
    map = m;
    store.set("gr-map", m.id);
    renderPickers();
    ex = drawMap($("exploreMap"), map);
    bindExploreFeatures();
    qm = drawMap($("quizMap"), map, { interactiveFeatures: false });
    $("stageTitle").textContent = `${map.name} map`;
    $("findInput").placeholder = `e.g. ${map.features[0].r4} or ${map.features[1].r6}`;
    $("findMsg").textContent = "";
    pinPt = null; revealed = false;
    renderReadout();
    renderLegend();
    endChallenge();
    showStart();
  }

  // ---------- Explore ----------
  const out4 = $("out4"), out6 = $("out6"), info = $("featureInfo"), pinState = $("pinState"), revealBtn = $("revealBtn");
  const zoomSvg = $("zoomSvg"), zoomText = $("zoomText");

  function drawZoom(r, u, v, hideText) {
    zoomSvg.innerHTML = "";
    el("rect", { x: 0, y: 0, width: 200, height: 200, class: "z-sq" }, zoomSvg);
    for (let k = 1; k < 10; k++) {
      el("line", { x1: k * 20, y1: 0, x2: k * 20, y2: 200, class: "z-tick" }, zoomSvg);
      el("line", { x1: 0, y1: k * 20, x2: 200, y2: k * 20, class: "z-tick" }, zoomSvg);
    }
    el("text", { x: 0, y: 228, class: "z-num" }, zoomSvg).textContent = r ? r.E : "";
    el("text", { x: 200, y: 228, class: "z-num" }, zoomSvg).textContent = r ? pad2(+r.E + 1) : "";
    el("text", { x: -22, y: 207, class: "z-num" }, zoomSvg).textContent = r ? r.N : "";
    el("text", { x: -22, y: 8, class: "z-num" }, zoomSvg).textContent = r ? pad2(+r.N + 1) : "";
    if (!r) { zoomText.textContent = "Click the map to see how the 6-figure reference is worked out."; return; }
    const px = (u - r.i) * 200, py = 200 - (v - r.j) * 200;
    el("rect", { x: r.te * 20, y: 200 - (r.tn + 1) * 20, width: 20, height: 20, fill: "var(--accent-soft)" }, zoomSvg);
    if (!hideText) {
      el("path", { d: `M0 200H${px}`, class: "z-line z-e" }, zoomSvg);
      el("path", { d: `M${px} 200V${py}`, class: "z-line z-n" }, zoomSvg);
    }
    el("circle", { cx: px, cy: py, r: 8, class: "z-dot" }, zoomSvg);
    zoomText.innerHTML = hideText
      ? "Count the tenths <span style=\"color:var(--accent)\">along</span>, then <span style=\"color:#af52de\">up</span>. Press <strong>Reveal</strong> to check."
      : `<span style="color:var(--accent)">Along:</span> <strong>${r.E}</strong> + <strong>${r.te}</strong> tenths → <span class="ref">${r.E}${r.te}</span><br>` +
        `<span style="color:#af52de">Up:</span> <strong>${r.N}</strong> + <strong>${r.tn}</strong> tenths → <span class="ref">${r.N}${r.tn}</span><br>` +
        `So the 6-figure ref is <span class="ref">${fmt6(r.r6)}</span>`;
  }

  // show reference for a point (pinned or live hover)
  function renderReadout(pt = pinPt, live = false) {
    const masked = hidden && !revealed && !live;
    const liveMasked = hidden && live;
    if (!pt) {
      out4.textContent = "----"; out6.textContent = "--- ---";
      pinState.textContent = "Click the map"; pinState.className = "chip";
      revealBtn.hidden = true;
      drawZoom(null);
      if (ex) callout(ex, 0, 0, null);
      return;
    }
    const r = refs(map, pt.u, pt.v);
    const mask = masked || liveMasked;
    out4.textContent = mask ? "• • • •" : r.r4;
    out6.textContent = mask ? "• • • • • •" : fmt6(r.r6);
    out4.classList.toggle("masked", mask); out6.classList.toggle("masked", mask);
    pinState.textContent = live ? "Pointing" : "Pinned";
    pinState.className = "chip" + (live ? "" : " on");
    revealBtn.hidden = !(hidden && !revealed && !live);
    drawZoom(r, pt.u, pt.v, mask);
    if (!live) callout(ex, pt.u, pt.v, mask ? "?" : fmt6(r.r6));
  }

  function setPin(u, v, label) {
    pinPt = { u, v }; revealed = false;
    ex.marks.querySelectorAll(".m-pin").forEach(n => n.remove());
    pin(ex, u, v);
    renderReadout();
    const r = refs(map, u, v);
    const here = map.features.find(f => Math.hypot(f.u - u, f.v - v) < .3);
    info.innerHTML = label || (here
      ? `Near the <strong>${lc(here)}</strong>.`
      : `Square <strong>${hidden && !revealed ? "?" : r.r4}</strong>. Drag or click again to move the pin.`);
  }

  function bindExploreFeatures() {
    map.features.forEach(f => {
      const node = ex.nodes[f.id];
      const pick = evt => {
        evt.stopPropagation();
        Object.values(ex.nodes).forEach(n => n.classList.remove("active"));
        node.classList.add("active");
        setPin(f.u, f.v, `<strong>${f.name}</strong>${hidden ? "" : `: 4-figure <span class="ref">${f.r4}</span>, 6-figure <span class="ref">${fmt6(f.r6)}</span>`}`);
      };
      node.addEventListener("click", pick);
      node.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(e); } });
    });
  }

  // map-level pointer handlers (bound once; the svg element is reused when maps change)
  const exSvg = $("exploreMap");
  let down = false;
  exSvg.addEventListener("pointermove", evt => {
    const p = svgPoint(exSvg, evt);
    if (!inMap(p)) { hideHover(ex); renderReadout(); return; }
    showHover(ex, U(p.x), V(p.y));
    if (down) setPin(U(p.x), V(p.y));
    else if (evt.pointerType === "mouse") renderReadout({ u: U(p.x), v: V(p.y) }, true);
  });
  exSvg.addEventListener("pointerdown", evt => {
    if (evt.target.closest(".m-feature")) return;
    const p = svgPoint(exSvg, evt);
    if (!inMap(p)) return;
    down = true;
    try { exSvg.setPointerCapture(evt.pointerId); } catch { /* ignore */ }
    Object.values(ex.nodes).forEach(n => n.classList.remove("active"));
    setPin(U(p.x), V(p.y));
  });
  const up = () => { down = false; };
  exSvg.addEventListener("pointerup", up);
  exSvg.addEventListener("pointercancel", up);
  exSvg.addEventListener("pointerleave", () => { hideHover(ex); if (!down) renderReadout(); });

  revealBtn.addEventListener("click", () => {
    revealed = true; renderReadout();
    const r = refs(map, pinPt.u, pinPt.v);
    const here = map.features.find(f => Math.hypot(f.u - pinPt.u, f.v - pinPt.v) < .3);
    info.innerHTML = here ? `<strong>${here.name}</strong>: <span class="ref">${r.r4}</span> / <span class="ref">${fmt6(r.r6)}</span>` : `Square <span class="ref">${r.r4}</span>, point <span class="ref">${fmt6(r.r6)}</span>`;
  });
  $("hideToggle").addEventListener("change", e => {
    hidden = e.target.checked; revealed = false;
    $("stage").classList.toggle("answers-hidden", hidden);
    renderReadout();
    if (pinPt) info.textContent = hidden ? "Answers hidden. Work it out, then press Reveal." : "Answers showing.";
  });

  function renderLegend() {
    const legend = $("legend");
    legend.innerHTML = "";
    map.features.forEach(f => {
      const li = document.createElement("li");
      li.innerHTML = `<svg viewBox="-22 -22 44 44">${ICONS[f.icon]}</svg>${f.name}`;
      li.addEventListener("click", () => ex.nodes[f.id].dispatchEvent(new MouseEvent("click")));
      legend.appendChild(li);
    });
  }

  // finder
  const findInput = $("findInput"), findMsg = $("findMsg");
  findInput.addEventListener("input", () => { findInput.value = findInput.value.replace(/[^\d ]/g, ""); });
  $("findForm").addEventListener("submit", evt => {
    evt.preventDefault();
    const p = parseRef(map, findInput.value);
    ex.marks.innerHTML = "";
    if (p.error === "off") {
      findMsg.innerHTML = `That's not on this map. Eastings here go <strong>${pad2(map.e0)}–${pad2(map.e0 + 9)}</strong>, northings <strong>${pad2(map.n0)}–${pad2(map.n0 + 9)}</strong>.`;
      return;
    }
    if (p.error) { findMsg.textContent = p.error; return; }
    squareRect(ex, p.i, p.j, "m-good");
    const r = p.r;
    const here = p.six ? map.features.find(f => f.r6 === r) : map.features.find(f => f.r4 === r);
    setPin(p.u, p.v);
    if (!p.six) { ex.marks.querySelectorAll(".m-pin").forEach(n => n.remove()); callout(ex, p.u, p.v, hidden ? "?" : r); }
    findMsg.innerHTML = here ? `Found: <strong>${here.name}</strong>`
      : p.six ? `Point <span class="ref">${fmt6(r)}</span> is pinned.` : `Square <span class="ref">${r}</span> is highlighted.`;
  });

  // ---------- Class challenge ----------
  const chBox = $("challenge"), chQ = $("challengeQ"), chA = $("challengeA");
  function newChallenge() {
    ex.marks.innerHTML = ""; callout(ex, 0, 0, null);
    Object.values(ex.nodes).forEach(n => n.classList.remove("active"));
    const kind = ["find4", "find6", "name6", "what6", "name4"][rint(0, 4)];
    const f = map.features[rint(0, map.features.length - 1)];
    if (kind === "find4") {
      const i = rint(0, 9), j = rint(0, 9), r = refs(map, i + .5, j + .5);
      challenge = { q: `Find square <span class="ref">${r.r4}</span>`, reveal() { squareRect(ex, i, j, "m-good"); return `Here it is: along to ${r.E}, up to ${r.N}.`; } };
    } else if (kind === "find6") {
      const u = rint(0, 99) / 10 + .05, v = rint(0, 99) / 10 + .05, r = refs(map, u, v);
      challenge = { q: `Find point <span class="ref">${fmt6(r.r6)}</span>`, reveal() { squareRect(ex, r.i, r.j, "m-good"); pin(ex, u, v); callout(ex, u, v, fmt6(r.r6)); return `${r.E} + ${r.te} tenths along, ${r.N} + ${r.tn} tenths up.`; } };
    } else if (kind === "name6" || kind === "name4") {
      const six = kind === "name6";
      ex.nodes[f.id].classList.add("active");
      challenge = { q: `Give the ${six ? "6" : "4"}-figure reference for the <strong>${lc(f)}</strong>`, reveal() { squareRect(ex, f.i, f.j, "m-good"); return `<span class="ref">${six ? fmt6(f.r6) : f.r4}</span>`; } };
    } else {
      challenge = { q: `What is at <span class="ref">${fmt6(f.r6)}</span>?`, reveal() { ex.nodes[f.id].classList.add("active"); squareRect(ex, f.i, f.j, "m-good"); return `The <strong>${lc(f)}</strong>.`; } };
    }
    chQ.innerHTML = challenge.q; chA.innerHTML = ""; chBox.hidden = false;
    $("challengeReveal").disabled = false;
    $("stage").classList.add("challenge-on");
  }
  function endChallenge() {
    challenge = null; chBox.hidden = true;
    $("stage").classList.remove("challenge-on");
  }
  $("challengeBtn").addEventListener("click", newChallenge);
  $("challengeNext").addEventListener("click", newChallenge);
  $("challengeEnd").addEventListener("click", () => { endChallenge(); ex.marks.innerHTML = ""; });
  $("challengeReveal").addEventListener("click", () => {
    if (!challenge) return;
    chA.innerHTML = challenge.reveal();
    $("challengeReveal").disabled = true;
  });

  // ---------- Projector mode ----------
  const stage = $("stage"), projBtn = $("projectorBtn");
  function setProjector(on) {
    stage.classList.toggle("projector", on);
    document.body.classList.toggle("no-scroll", on);
    projBtn.querySelector("span").textContent = on ? "Exit projector" : "Projector mode";
  }
  projBtn.addEventListener("click", () => {
    const on = !stage.classList.contains("projector");
    if (on) { setProjector(true); stage.requestFullscreen?.().catch(() => {}); }
    else { if (document.fullscreenElement) document.exitFullscreen?.(); setProjector(false); }
  });
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && stage.classList.contains("projector")) setProjector(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && stage.classList.contains("projector")) setProjector(false); });

  // ---------- Printable worksheet ----------
  $("printBtn").addEventListener("click", () => {
    const sheet = $("printSheet");
    const feats = shuffle([...map.features]);
    const qs = [];
    feats.slice(0, 4).forEach(f => qs.push([`Give the 4-figure grid reference for the ${lc(f)}.`, f.r4]));
    feats.slice(4, 7).forEach(f => qs.push([`Give the 6-figure grid reference for the ${lc(f)}.`, fmt6(f.r6)]));
    feats.slice(7, 9).forEach(f => qs.push([`What is at ${fmt6(f.r6)}?`, f.name]));
    const { a, b, idx } = dirPair(map);
    qs.push([`Which direction is the ${lc(a)} from the ${lc(b)}?`, DIRS[idx]]);
    const clone = $("exploreMap").cloneNode(true);
    clone.removeAttribute("id");
    clone.querySelectorAll(".m-marks, .m-top, .m-overlay").forEach(n => n.innerHTML = "");
    clone.querySelectorAll(".active").forEach(n => n.classList.remove("active"));
    clone.querySelector("clipPath").id = "print-clip";
    clone.querySelector("[clip-path]").setAttribute("clip-path", "url(#print-clip)");
    const key = map.features.map(f => `<li><svg viewBox="-22 -22 44 44">${ICONS[f.icon]}</svg>${f.name}</li>`).join("");
    sheet.innerHTML = `
      <section class="ws-page">
        <header class="ws-head"><div><h1>Grid References</h1><p>${map.name} map worksheet</p></div>
          <div class="ws-name">Name: ______________________<br>Date: ______________</div></header>
        <div class="ws-body"><div class="ws-map"></div><ul class="ws-key">${key}</ul></div>
        <ol class="ws-qs">${qs.map(([q]) => `<li>${q}<span class="ws-line"></span></li>`).join("")}</ol>
        <p class="ws-tip">Remember: along the corridor, then up the stairs.</p>
      </section>
      <section class="ws-page ws-answers"><h2>Answers: ${map.name} map</h2>
        <ol>${qs.map(([q, a]) => `<li>${q} <strong>${a}</strong></li>`).join("")}</ol></section>`;
    sheet.querySelector(".ws-map").appendChild(clone);
    window.print();
  });

  // ---------- Quiz ----------
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
  const bestKey = () => `gr-best-${map.id}-${mode}`;
  const best = () => +(store.get(bestKey()) || 0);

  function setMode(m) {
    mode = m;
    store.set("gr-mode", m);
    [...qModes.children].forEach(b => b.setAttribute("aria-checked", b.dataset.mode === m));
    const b = best();
    qModeInfo.innerHTML = `${MODES[m].info} <span class="best">${map.name} map${b ? ` · Best: ${b}/${TOTAL}` : ""}</span>`;
  }
  [...qModes.children].forEach(b => b.addEventListener("click", () => setMode(b.dataset.mode)));

  function dirPair(m) {
    for (let tries = 0; tries < 300; tries++) {
      const [a, b] = shuffle([...m.features]);
      const d = bearing(a, b), idx = Math.round(d / 45) % 8;
      const off = Math.min(Math.abs(d - idx * 45), Math.abs(d - idx * 45 - 360));
      if (off < 13 && Math.hypot(a.u - b.u, a.v - b.v) > 2) return { a, b, idx };
    }
    const [a, b] = m.features;
    return { a, b, idx: Math.round(bearing(a, b) / 45) % 8 };
  }

  function makeQuestions() {
    const types = shuffle([...MODES[mode].types]);
    const feats = shuffle([...map.features]);
    let fi = 0;
    const r4At = (i, j) => (i >= 0 && i <= 9 && j >= 0 && j <= 9) ? refs(map, i + .5, j + .5).r4 : null;
    const r6At = (u, v) => (u >= 0 && u < 10 && v >= 0 && v < 10) ? refs(map, u, v).r6 : null;
    return types.map(type => {
      const f = feats[fi++ % feats.length];
      if (type === "ref4") {
        const pool = [f.N + f.E, r4At(f.i + 1, f.j), r4At(f.i, f.j + 1), r4At(f.i - 1, f.j), r4At(f.i, f.j - 1), r4At(f.i + 1, f.j + 1)];
        return { type, f, text: `What is the 4-figure grid reference for the <strong>${lc(f)}</strong>?`, answer: f.r4, options: uniq(f.r4, pool), mono: true,
          why: `Go along to ${f.E}, then up to ${f.N}: <span class="ref">${f.r4}</span>.` };
      }
      if (type === "ref6") {
        const pool = [f.r6.slice(3) + f.r6.slice(0, 3), r6At(f.u + .1, f.v), r6At(f.u, f.v + .1), r6At(f.u - .1, f.v), r6At(f.u, f.v - .1), r6At(f.u, f.v + 1)];
        return { type, f, text: `What is the 6-figure grid reference for the <strong>${lc(f)}</strong>?`, answer: f.r6, options: uniq(f.r6, pool), mono: true, fmt: fmt6,
          why: `Along: ${f.E} + ${f.te} tenths. Up: ${f.N} + ${f.tn} tenths. So <span class="ref">${fmt6(f.r6)}</span>.` };
      }
      if (type === "what4" || type === "what6") {
        const six = type === "what6", r = six ? fmt6(f.r6) : f.r4;
        const pool = map.features.filter(x => x !== f).map(x => x.name);
        return { type, f, text: six ? `Which feature is at <span class="ref">${r}</span>?` : `Which feature is in square <span class="ref">${r}</span>?`,
          answer: f.name, options: uniq(f.name, pool), why: `The ${lc(f)} is at <span class="ref">${r}</span>.` };
      }
      if (type === "dir") {
        const { a, b, idx } = dirPair(map);
        const pool = [DIRS[(idx + 4) % 8], ...shuffle([DIRS[(idx + 1) % 8], DIRS[(idx + 7) % 8], DIRS[(idx + 2) % 8], DIRS[(idx + 6) % 8]]).slice(0, 2)];
        return { type, a, b, text: `Which direction is the <strong>${lc(a)}</strong> from the <strong>${lc(b)}</strong>?`,
          answer: DIRS[idx], options: uniq(DIRS[idx], pool),
          why: `Start at the ${lc(b)} and look towards the ${lc(a)}: it's <strong>${DIRS[idx]}</strong>.` };
      }
      const i = rint(0, 9), j = rint(0, 9), r = r4At(i, j);
      const E = pad2(map.e0 + i), N = pad2(map.n0 + j);
      return { type, text: `Tap grid square <span class="ref">${r}</span> on the map.`, answer: r, i, j,
        why: `Along to ${E}, up to ${N}. The square is to the <strong>right of</strong> and <strong>above</strong> that corner.` };
    });
  }

  function clearQuizMap() {
    if (!qm) return;
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
    qScore.textContent = "Score 0";
    qNext.disabled = false; qNext.textContent = "Start quiz";
  }
  function showQuestion() {
    answered = false;
    clearQuizMap();
    qModes.hidden = true; qModeInfo.textContent = "";
    const q = questions[qi];
    qCount.textContent = `${map.name} · ${MODES[mode].label} · ${qi + 1} of ${TOTAL}`;
    qProgress.style.width = `${(qi / TOTAL) * 100}%`;
    qText.innerHTML = q.text;
    qFeedback.textContent = ""; qFeedback.className = "feedback";
    qOptions.innerHTML = "";
    qNext.disabled = true;
    qNext.textContent = qi === TOTAL - 1 ? "See results" : "Next";
    if (q.type === "ref4" || q.type === "ref6") qm.nodes[q.f.id].classList.add("active");
    if (q.type === "dir") { qm.nodes[q.a.id].classList.add("active"); qm.nodes[q.b.id].classList.add("active"); }
    if (q.type === "tap") { qOptions.innerHTML = `<div class="tap-hint">Tap a square on the map</div>`; return; }
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
    [...qOptions.children].forEach(b => { b.disabled = true; if (b.dataset.value === q.answer) b.classList.add("correct"); });
    if (!correct) btn.classList.add("wrong");
    if (q.type === "dir") arrowBetween(qm, q.b, q.a);
    else { qm.nodes[q.f.id].classList.add("active"); squareRect(qm, q.f.i, q.f.j, "m-good"); }
    finishAnswer(correct, q);
  }
  const tapActive = () => qi >= 0 && qi < TOTAL && questions[qi].type === "tap" && !answered;
  const quizSvg = $("quizMap");
  quizSvg.addEventListener("pointermove", evt => {
    if (!tapActive()) return;
    const p = svgPoint(quizSvg, evt);
    if (!inMap(p)) { hideHover(qm); return; }
    showHover(qm, U(p.x), V(p.y), false);
  });
  quizSvg.addEventListener("pointerleave", () => qm && hideHover(qm));
  quizSvg.addEventListener("click", evt => {
    if (!tapActive()) return;
    const p = svgPoint(quizSvg, evt);
    if (!inMap(p)) return;
    const q = questions[qi];
    const r = refs(map, U(p.x), V(p.y));
    const correct = r.r4 === q.answer;
    hideHover(qm);
    if (!correct) squareRect(qm, r.i, r.j, "m-bad");
    squareRect(qm, q.i, q.j, "m-good");
    qOptions.innerHTML = `<div class="tap-hint">You tapped <span class="ref">${r.r4}</span></div>`;
    finishAnswer(correct, q);
    if (matchMedia("(max-width: 860px)").matches) qFeedback.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  function showResults() {
    clearQuizMap();
    qi = TOTAL;
    qProgress.style.width = "100%";
    qCount.textContent = `${map.name} · ${MODES[mode].label} · Finished`;
    const prev = best(), isBest = score > prev;
    if (isBest) store.set(bestKey(), score);
    const msg = score === 10 ? "Perfect score. You're a grid reference pro! 🏆"
      : score >= 8 ? "Excellent work. Nearly perfect!"
      : score >= 5 ? "Good effort. Check the cheat sheet and try again."
      : "Keep practising. Remember: along the corridor, then up the stairs.";
    qText.innerHTML = `<div class="result-big">${score}/${TOTAL}</div>${msg}` + (isBest && prev ? ` <span class="best">New best!</span>` : "");
    qOptions.innerHTML = missed.length
      ? `<span class="label" style="margin-top:8px">Review</span><ul class="review">${missed.map(m => `<li>${m}</li>`).join("")}</ul>` : "";
    qFeedback.textContent = ""; qFeedback.className = "feedback";
    qModes.hidden = false; setMode(mode);
    qNext.disabled = false; qNext.textContent = "Play again";
    if (score >= 9) confetti();
  }
  function start() {
    questions = makeQuestions(); qi = 0; score = 0; streak = 0; missed = [];
    setScore(); showQuestion();
  }
  qNext.addEventListener("click", () => {
    if (qi === -1 || qi >= TOTAL) start();
    else if (qi === TOTAL - 1) showResults();
    else { qi++; showQuestion(); }
  });
  const quizEl = document.querySelector(".quiz");
  document.addEventListener("keydown", e => {
    if (e.target.closest("input, textarea") || e.metaKey || e.ctrlKey || e.altKey) return;
    if (stage.classList.contains("projector")) return;
    const r = quizEl.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    if (/^[1-4]$/.test(e.key) && !answered && qi >= 0 && qi < TOTAL) {
      const b = qOptions.querySelectorAll(".opt")[+e.key - 1];
      if (b) { e.preventDefault(); answer(b); }
    } else if (e.key === "Enter" && !qNext.disabled && document.activeElement === document.body) {
      e.preventDefault(); qNext.click();
    }
  });

  // ---------- confetti ----------
  function confetti() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = $("confetti"), ctx = c.getContext("2d");
    const dpr = devicePixelRatio || 1;
    c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

  // ---------- go ----------
  setMap(map);

  const links = [...document.querySelectorAll(".nav-links a")];
  if ("IntersectionObserver" in window) {
    const navIO = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${en.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("section[id]").forEach(s => navIO.observe(s));
  }
  const io = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.08 }) : null;
  document.querySelectorAll(".reveal").forEach(n => io ? io.observe(n) : n.classList.add("in"));
})();
