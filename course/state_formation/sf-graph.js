/* sf-graph.js — computed-layout SVG genealogy for the State Formation course.
   Renders entirely from data/graph_spec.json (the single source of truth):
   node positions are DERIVED from each node's stage × lane, never hand-placed,
   so new nodes appear by editing the JSON alone. Reused visual language from the
   sibling genealogy pages; new pieces (S0 band, lenses, reach stubs) built from
   the existing palette. See course-sf.css. */
(function () {
  "use strict";

  // ---- layout constants (px) ----
  var RAIL = 128;            // left rail for stage labels
  var TOPPAD = 46;           // lane-header strip
  var LANE_W = { narrow: 206, medium: 308, wide: 616 };
  var NODE_W = 132, GAP_X = 12, PAD_X = 16;
  var ROW_STEP = 116, BAND_PAD = 30, BAND_MIN = 118;
  var RIGHT_PAD = 40;

  // ---- lens palettes (existing brand hues + on-brand tints only) ----
  var LANE_COLOR = {
    material_tech: "#315b7c", coercion_extraction: "#9a5737",
    org_representation: "#62577f", justification_belief: "#b98d40"
  };
  var METHOD_COLOR = {
    deductive_theory:"#24493d", comparative_historical:"#315b7c", analytic_narrative:"#62577f",
    formal_model:"#9a5737", case_illustration:"#b98d40", grid_gis:"#3f7d6a",
    natural_experiment:"#4a7ba6", rdd:"#7a4a8c", did:"#b0713f", panel_fe:"#607066",
    iv:"#2f6d5a", index_construction:"#8a6d2e", network_data:"#855a9e", simulation:"#5a8fb0",
    survival_analysis:"#a0603f", review_critique:"#4b5a52", field_data:"#6b8f5a"
  };
  var TILLY_COLOR = {
    anchor:"#24493d", precursor:"#607066", supports:"#3f7d6a",
    qualifies:"#b98d40", challenges:"#9a5737", extends:"#315b7c"
  };
  var LEGIT_COLOR = {
    functional_compliance:"#3f7d6a", credible_commitment:"#315b7c", belief_production:"#62577f",
    normative:"#24493d", ideational_emulation:"#8a6d2e", counter_thesis:"#9a5737"
  };
  var METHOD_LABEL = {
    deductive_theory:{en:"Deductive theory",zh:"演绎理论"}, comparative_historical:{en:"Comparative history",zh:"比较历史"},
    analytic_narrative:{en:"Analytic narrative",zh:"分析性叙事"}, formal_model:{en:"Formal model",zh:"形式模型"},
    case_illustration:{en:"Case illustration",zh:"案例说明"}, grid_gis:{en:"Grid / GIS",zh:"网格/GIS"},
    natural_experiment:{en:"Natural experiment",zh:"自然实验"}, rdd:{en:"RDD",zh:"断点回归"},
    did:{en:"Diff-in-diff",zh:"双重差分"}, panel_fe:{en:"Panel FE",zh:"面板固定效应"}, iv:{en:"IV",zh:"工具变量"},
    index_construction:{en:"Index construction",zh:"指数构造"}, network_data:{en:"Network data",zh:"网络数据"},
    simulation:{en:"Simulation",zh:"模拟"}, survival_analysis:{en:"Survival analysis",zh:"生存分析"},
    review_critique:{en:"Review / critique",zh:"综述/批判"}, field_data:{en:"Field data",zh:"田野数据"}
  };
  var TILLY_LABEL = {
    anchor:{en:"Anchor",zh:"锚点"}, precursor:{en:"Precursor",zh:"先声"}, supports:{en:"Supports",zh:"支持"},
    qualifies:{en:"Qualifies",zh:"限定"}, challenges:{en:"Challenges",zh:"挑战"}, extends:{en:"Extends",zh:"扩展"}
  };
  var LEGIT_LABEL = {
    functional_compliance:{en:"Functional compliance",zh:"功能性服从"}, credible_commitment:{en:"Credible commitment",zh:"可信承诺"},
    belief_production:{en:"Belief production",zh:"信念生产"}, normative:{en:"Normative",zh:"规范合法性"},
    ideational_emulation:{en:"Ideational emulation",zh:"观念模仿"}, counter_thesis:{en:"Counter-thesis",zh:"反命题"}
  };

  // spelled-out middle names the generic surname parser cannot tell apart from a
  // compound surname; presentation-only refinement of the derived node label.
  var LABEL_OVERRIDE = { hariri2012: "Hariri" };

  function surname(a) {
    a = a.trim();
    var toks = a.split(/\s+/);
    if (toks.length <= 1) return a;
    var rest = toks.slice(1);
    while (rest.length && /^[A-Z]\.?$/.test(rest[0])) rest = rest.slice(1);
    return rest.length ? rest.join(" ") : toks[toks.length - 1];
  }
  function nodeLabel(n) {
    var base;
    if (LABEL_OVERRIDE[n.id]) {
      base = LABEL_OVERRIDE[n.id];
    } else {
      var cite = n.citation_en, m = cite.match(/^(.*?)\s*\(/);
      var ap = (m ? m[1] : cite.split(",")[0]).replace(/^Max\s+/, "");
      var authors = ap.split(/\s*&\s*|,\s*/).filter(Boolean);
      var s = authors.map(surname);
      base = s.length >= 3 ? s[0] + " et al." : (s.length === 2 ? s[0] + " & " + s[1] : s[0]);
    }
    return base + (n.year ? " " + n.year : "");
  }

  var T = {
    en: { open:"open page →", persist:"traces consequences to the present", ghost:"conceptual anchor · no detail page",
          hint:"Hover a node or edge for context; click a node to open its page. On touch, tap once for the tooltip, then the link.",
          chainCap:"Chain lens — the five-segment problem chain. Trunk edges emphasized; nodes colored by lane." },
    zh: { open:"打开页面 →", persist:"追踪后果至当代", ghost:"概念锚点 · 无详情页",
          hint:"悬停节点或连线查看语境；点击节点进入其页面。触屏：先轻点显示提示，再点链接。",
          chainCap:"链条透镜——五段问题链。主干连线加粗；节点按泳道着色。" }
  };

  function lang() { return (window.sfLang && window.sfLang()) || document.documentElement.getAttribute("data-lang") || "en"; }
  function tx(o, l) { return o ? (o[l] != null ? o[l] : o.en) : ""; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function ce(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function sv(tag) { return document.createElementNS("http://www.w3.org/2000/svg", tag); }

  var DATA = null, LAYOUT = null, LENS = "chain";

  function computeLayout(data) {
    var lanes = data.lanes.slice().sort(function (a, b) { return a.order - b.order; });
    var stages = data.stages.slice().sort(function (a, b) { return a.order - b.order; });
    var laneX = {}, x = RAIL;
    lanes.forEach(function (l) { l._w = LANE_W[l.width]; laneX[l.id] = x; x += l._w; });
    var totalW = x + RIGHT_PAD;

    // group nodes by stage x lane
    var cell = {};
    data.nodes.forEach(function (n) {
      var k = n.stage + "|" + n.lane;
      (cell[k] = cell[k] || []).push(n);
    });
    Object.keys(cell).forEach(function (k) {
      cell[k].sort(function (a, b) { return (a.year || 0) - (b.year || 0); });
    });

    var pos = {}, bands = [], y = TOPPAD;
    stages.forEach(function (s) {
      var maxRows = 1;
      lanes.forEach(function (l) {
        var arr = cell[s.id + "|" + l.id] || [];
        if (!arr.length) return;
        var avail = l._w - 2 * PAD_X;
        var sub = Math.max(1, Math.floor((avail + GAP_X) / (NODE_W + GAP_X)));
        var rows = Math.ceil(arr.length / sub);
        if (rows > maxRows) maxRows = rows;
      });
      var h = Math.max(BAND_MIN, 2 * BAND_PAD + maxRows * ROW_STEP);
      var bandTop = y;
      lanes.forEach(function (l) {
        var arr = cell[s.id + "|" + l.id] || [];
        if (!arr.length) return;
        var avail = l._w - 2 * PAD_X;
        var sub = Math.max(1, Math.floor((avail + GAP_X) / (NODE_W + GAP_X)));
        for (var i = 0; i < arr.length; i++) {
          var row = Math.floor(i / sub), col = i % sub;
          var inRow = Math.min(sub, arr.length - row * sub);
          var rowW = inRow * NODE_W + (inRow - 1) * GAP_X;
          var startX = laneX[l.id] + (l._w - rowW) / 2 + NODE_W / 2;
          pos[arr[i].id] = {
            x: startX + col * (NODE_W + GAP_X),
            y: bandTop + BAND_PAD + row * ROW_STEP + ROW_STEP / 2
          };
        }
      });
      bands.push({ stage: s, top: bandTop, h: h });
      y += h;
    });

    return { lanes: lanes, stages: stages, laneX: laneX, pos: pos, bands: bands,
             width: totalW, height: y + 20, cell: cell };
  }

  // ---- tooltip ----
  var tip;
  function ensureTip() {
    if (tip) return tip;
    tip = ce("div", "sf-tooltip");
    document.body.appendChild(tip);
    return tip;
  }
  function showTip(html, clientX, clientY, pinned) {
    ensureTip();
    tip.innerHTML = html;
    tip.classList.toggle("pinned", !!pinned);
    var pad = 16, w = 330, h = tip.offsetHeight || 160;
    var lx = Math.min(clientX + 14, window.innerWidth - w - pad);
    var ty = Math.min(clientY + 14, window.innerHeight - h - pad);
    tip.style.left = Math.max(pad, lx) + "px";
    tip.style.top = Math.max(pad, ty) + "px";
    tip.classList.add("show");
  }
  function hideTip() { if (tip) tip.classList.remove("show"); }

  var HAS_HOVER = true;
  try { HAS_HOVER = window.matchMedia("(hover: hover)").matches; } catch (e) {}

  // ---- render ----
  function render() {
    var l = lang();
    var host = document.getElementById("sfGraph");
    if (!host || !DATA) return;
    LAYOUT = LAYOUT || computeLayout(DATA);
    var LY = LAYOUT, byId = {}; DATA.nodes.forEach(function (n) { byId[n.id] = n; });

    host.innerHTML = "";
    var canvas = ce("div", "sf-canvas");
    canvas.style.width = LY.width + "px";
    canvas.style.height = LY.height + "px";
    canvas.style.minWidth = LY.width + "px";
    host.appendChild(canvas);

    // stage bands
    LY.bands.forEach(function (b, i) {
      var bg = ce("div", "sf-band-bg" + (b.stage.id === "S0" ? " s0" : (i % 2 ? " alt" : "")));
      bg.style.left = "0px"; bg.style.top = b.top + "px";
      bg.style.width = LY.width + "px"; bg.style.height = b.h + "px";
      canvas.appendChild(bg);
      // stage label on the rail
      var sl = ce("div", "sf-stage-label");
      sl.style.top = (b.top + b.h / 2) + "px";
      sl.innerHTML = '<div class="sl-id">' + esc(b.stage.id) + '</div>' +
        '<div class="sl-name">' + esc(tx({en:b.stage.label_en, zh:b.stage.label_zh}, l)) + '</div>' +
        '<div class="sl-per">' + esc(tx({en:b.stage.period_en, zh:b.stage.period_zh}, l)) + '</div>';
      canvas.appendChild(sl);
    });

    // lane headers
    LY.lanes.forEach(function (lane) {
      var hd = ce("div", "sf-lane-header");
      hd.style.left = LY.laneX[lane.id] + "px";
      hd.style.top = "8px";
      hd.style.width = lane._w + "px";
      hd.innerHTML = esc(tx({en:lane.label_en, zh:lane.label_zh}, l)) +
        '<div class="lh-bar" style="background:' + LANE_COLOR[lane.id] + '"></div>';
      canvas.appendChild(hd);
    });

    // SVG edge layer
    var svg = sv("svg"); svg.setAttribute("class", "sf-svg");
    svg.setAttribute("viewBox", "0 0 " + LY.width + " " + LY.height);
    var defs = sv("defs");
    defs.innerHTML =
      '<marker id="sfArrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">' +
      '<path d="M1,1 L6,4 L1,7" fill="none" stroke="#62577f" stroke-width="1.4"/></marker>';
    svg.appendChild(defs);
    canvas.appendChild(svg);

    var tillyOn = LENS === "tilly";
    var placedLabels = [];   // label boxes already placed, to de-clutter keywords
    function nodeRect(id) { var p = LY.pos[id]; return { l:p.x-NODE_W/2-6, r:p.x+NODE_W/2+6, t:p.y-40, b:p.y+40 }; }
    var allNodeRects = DATA.nodes.map(function (n) { return nodeRect(n.id); });
    function overlaps(box, rects) { return rects.some(function (r) { return !(box.r<r.l||box.l>r.r||box.b<r.t||box.t>r.b); }); }

    // reach stubs
    DATA.nodes.forEach(function (n) {
      if (!n.lane_reach || !n.lane_reach.length) return;
      var p = LY.pos[n.id]; if (!p) return;
      var myOrder = byId[n.id] && LY.lanes.filter(function(x){return x.id===n.lane;})[0].order;
      n.lane_reach.forEach(function (rl, k) {
        var target = LY.lanes.filter(function (x) { return x.id === rl; })[0];
        if (!target) return;
        var dir = target.order > myOrder ? 1 : -1;
        var y = p.y - 12 + k * 8;
        var st = sv("line");
        st.setAttribute("x1", p.x + dir * (NODE_W / 2));
        st.setAttribute("y1", y);
        st.setAttribute("x2", p.x + dir * (NODE_W / 2 + 20));
        st.setAttribute("y2", y);
        st.setAttribute("class", "reach-stub");
        svg.appendChild(st);
      });
    });

    // edges
    DATA.edges.forEach(function (e) {
      var a = LY.pos[e.source], b = LY.pos[e.target];
      if (!a || !b) return;
      var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      var nx = -dy / len, ny = dx / len;
      var bulge = Math.max(16, Math.min(60, len * 0.13)) * (dx >= 0 ? 1 : -1);
      var c1x = a.x + dx * 0.33 + nx * bulge, c1y = a.y + dy * 0.33 + ny * bulge;
      var c2x = a.x + dx * 0.66 + nx * bulge, c2y = a.y + dy * 0.66 + ny * bulge;
      var d = "M " + a.x + " " + a.y + " C " + c1x + " " + c1y + ", " + c2x + " " + c2y + ", " + b.x + " " + b.y;

      var path = sv("path");
      path.setAttribute("d", d);
      var cls = "edge-path edge-" + e.kind;
      if (e.kind === "feedback") path.setAttribute("marker-end", "url(#sfArrow)"), path.setAttribute("marker-start", "url(#sfArrow)");
      // lens emphasis / dim
      var emph = false, dim = false;
      if (LENS === "chain") { if (e.kind === "trunk") emph = true; }
      else if (tillyOn) {
        if (e.source === "tilly1992" || e.target === "tilly1992") emph = true; else dim = true;
      } // method / legitimacy lenses leave edges as-is
      if (emph) cls += " edge-emph";
      if (dim) cls += " edge-dim";
      path.setAttribute("class", cls);
      svg.appendChild(path);

      var hit = sv("path");
      hit.setAttribute("d", d); hit.setAttribute("class", "edge-hit");
      var tipHtml = '<strong>' + esc(tx({en:e.keyword_en, zh:e.keyword_zh}, l)) + '</strong>' +
        esc(tx({en:e.hover_en, zh:e.hover_zh}, l));
      bindTip(hit, tipHtml);
      svg.appendChild(hit);

      // keyword label near midpoint; nudge along the path and perpendicular to
      // avoid both nodes and previously-placed labels.
      var txt = tx({en:e.keyword_en, zh:e.keyword_zh}, l);
      var wpx = Math.min(190, Math.max(40, txt.length * (l === "zh" ? 11 : 6.4)));
      var tvals = [0.5, 0.4, 0.6, 0.33, 0.67, 0.25, 0.75];
      var offs = [0, 28, -28, 54, -54, 84, -84, 116, -116];
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 4, placed = null;
      outer:
      for (var ti = 0; ti < tvals.length; ti++) {
        var bx = a.x + dx * tvals[ti], by = a.y + dy * tvals[ti] - 4;
        for (var oi = 0; oi < offs.length; oi++) {
          var tX = bx + nx * offs[oi], tY = by + ny * offs[oi];
          var box = { l:tX-wpx/2, r:tX+wpx/2, t:tY-9, b:tY+6 };
          if (!overlaps(box, allNodeRects) && !overlaps(box, placedLabels)) { mx = tX; my = tY; placed = box; break outer; }
        }
      }
      if (!placed) placed = { l:mx-wpx/2, r:mx+wpx/2, t:my-9, b:my+6 };
      placedLabels.push(placed);
      var lt = sv("text");
      lt.setAttribute("x", mx); lt.setAttribute("y", my);
      lt.setAttribute("text-anchor", "middle");
      lt.setAttribute("class", "edge-label" + (e.kind === "trunk" ? " trunk-label" : "") + (dim ? " dim" : ""));
      lt.textContent = txt;
      bindTip(lt, tipHtml);
      svg.appendChild(lt);

      // trunk segment tag
      if (e.kind === "trunk" && e.segment) {
        var seg = sv("text");
        seg.setAttribute("x", mx); seg.setAttribute("y", my + 14);
        seg.setAttribute("text-anchor", "middle"); seg.setAttribute("class", "seg-tag");
        seg.textContent = e.segment.replace("-", "→");
        svg.appendChild(seg);
        placedLabels.push({ l:mx-16, r:mx+16, t:my+6, b:my+20 });
      }
    });

    // nodes
    var methodsPresent = {};
    DATA.nodes.forEach(function (n) {
      var p = LY.pos[n.id]; if (!p) return;
      var isGhost = n.type === "anchor_ghost";
      var el = isGhost ? ce("div") : ce("a");
      el.className = "g-node lane-" + n.lane + (isGhost ? " is-ghost" : "") + (n.special_render === "meta_method" ? " is-meta" : "");
      el.style.left = p.x + "px"; el.style.top = p.y + "px"; el.style.width = NODE_W + "px";
      if (!isGhost) { el.setAttribute("href", "lit/" + n.id + ".html"); }
      el.innerHTML = '<div class="g-label">' + esc(nodeLabel(n)) + '</div>';

      // lens-specific coloring / badges
      var badges = ce("div", "g-badges");
      if (LENS === "method") {
        var pm = (n.tags.method || [])[0];
        if (pm) { methodsPresent[pm] = true; el.style.borderLeftColor = METHOD_COLOR[pm] || "#607066";
          badges.appendChild(chip(tx(METHOD_LABEL[pm], l), METHOD_COLOR[pm])); }
      } else if (LENS === "legitimacy") {
        var lg = n.tags.legitimacy || [];
        if (lg.length) { lg.forEach(function (v) { badges.appendChild(chip(tx(LEGIT_LABEL[v], l), LEGIT_COLOR[v])); }); }
        else el.classList.add("dim");
      } else if (LENS === "tilly") {
        var tl = n.tags.tilly || [];
        if (tl.length) { tl.forEach(function (v) { badges.appendChild(chip(tx(TILLY_LABEL[v], l), TILLY_COLOR[v])); }); }
        else el.classList.add("dim");
      }
      if (badges.childNodes.length) el.appendChild(badges);

      if (n.persistence) {
        var pr = ce("span", "g-persist"); pr.textContent = "▼"; pr.title = T[l].persist;
        bindTip(pr, '<strong>persistence</strong>' + esc(T[l].persist));
        el.appendChild(pr);
      }

      // interactions
      var citeTip = '<strong>' + esc(tx({en:n.citation_en, zh:n.citation_zh}, l)) + '</strong>' +
        esc(tx({en:n.tooltip_en, zh:n.tooltip_zh}, l));
      if (isGhost) {
        bindTip(el, citeTip);
      } else {
        var href = "lit/" + n.id + ".html";
        var linkTip = citeTip + '<a class="tip-link" href="' + href + '">' + esc(T[l].open) + '</a>';
        if (HAS_HOVER) {
          el.addEventListener("mouseenter", function (ev) { showTip(citeTip, ev.clientX, ev.clientY, false); });
          el.addEventListener("mousemove", function (ev) { if (tip && tip.classList.contains("show") && !tip.classList.contains("pinned")) { tip.style.left = Math.min(ev.clientX+14, window.innerWidth-346)+"px"; tip.style.top = Math.min(ev.clientY+14, window.innerHeight-176)+"px"; } });
          el.addEventListener("mouseleave", hideTip);
          // click follows href by default
        } else {
          el.addEventListener("click", function (ev) {
            var r = el.getBoundingClientRect();
            ev.preventDefault();
            showTip(linkTip, r.left + r.width / 2 - 6, r.top + r.height / 2, true);
          });
        }
      }
      canvas.appendChild(el);
    });

    // dismiss pinned tooltip when tapping empty canvas
    if (!HAS_HOVER) {
      canvas.addEventListener("click", function (ev) {
        if (ev.target === canvas || (ev.target.classList && ev.target.classList.contains("sf-band-bg"))) hideTip();
      });
    }

    updateCaption(methodsPresent);
  }

  function chip(text, color) {
    var c = ce("span", "chip"); c.textContent = text;
    if (color) c.style.background = color;
    return c;
  }

  function bindTip(el, html) {
    if (HAS_HOVER) {
      el.addEventListener("mouseenter", function (ev) { showTip(html, ev.clientX, ev.clientY, false); });
      el.addEventListener("mousemove", function (ev) { if (tip && tip.classList.contains("show") && !tip.classList.contains("pinned")) { tip.style.left = Math.min(ev.clientX+14, window.innerWidth-346)+"px"; tip.style.top = Math.min(ev.clientY+14, window.innerHeight-176)+"px"; } });
      el.addEventListener("mouseleave", hideTip);
    } else {
      el.addEventListener("click", function (ev) { ev.preventDefault(); ev.stopPropagation(); showTip(html, ev.clientX, ev.clientY, true); });
    }
  }

  // ---- lens caption / legend ----
  function updateCaption(methodsPresent) {
    var l = lang(), cap = document.getElementById("sfCaption"), chainWrap = document.getElementById("sfChain");
    if (!cap) return;
    var lenses = DATA.lenses;
    if (LENS === "chain") {
      cap.innerHTML = esc(T[l].chainCap);
      if (chainWrap) chainWrap.style.display = "";
    } else {
      if (chainWrap) chainWrap.style.display = "none";
      if (LENS === "method") {
        var note = tx({en:lenses.method.note_en, zh:lenses.method.note_zh}, l);
        var present = lenses.method.values.filter(function (v) { return methodsPresent[v]; });
        var lg = present.map(function (v) {
          return '<span class="lg"><span class="sw" style="background:' + (METHOD_COLOR[v]||"#607066") + '"></span>' + esc(tx(METHOD_LABEL[v], l)) + '</span>';
        }).join("");
        cap.innerHTML = '<div class="sf-legend">' + lg + '</div><p style="margin:10px 0 0">' + esc(note) + '</p>';
      } else if (LENS === "legitimacy") {
        var lgv = lenses.legitimacy.values.map(function (v) {
          return '<span class="lg"><span class="sw" style="background:' + LEGIT_COLOR[v] + '"></span>' + esc(tx(LEGIT_LABEL[v], l)) + '</span>';
        }).join("");
        cap.innerHTML = '<div class="sf-legend">' + lgv + '</div><p style="margin:10px 0 0">' + esc(tx({en:lenses.legitimacy.note_en, zh:lenses.legitimacy.note_zh}, l)) + '</p>';
      } else if (LENS === "tilly") {
        var tlv = lenses.tilly.values.map(function (v) {
          return '<span class="lg"><span class="sw" style="background:' + TILLY_COLOR[v] + '"></span>' + esc(tx(TILLY_LABEL[v], l)) + '</span>';
        }).join("");
        cap.innerHTML = '<div class="sf-legend">' + tlv + '</div><p style="margin:10px 0 0">' + esc(tx({en:lenses.tilly.note_en, zh:lenses.tilly.note_zh}, l)) + '</p>';
      }
    }
  }

  function renderChainStepper() {
    var wrap = document.getElementById("sfChain"); if (!wrap || !DATA) return;
    var l = lang();
    var html = "";
    DATA.problem_chain.forEach(function (c, i) {
      if (i) html += '<div class="arrow">→</div>';
      html += '<div class="seg"><div class="k">' + esc(c.id) + '</div><div class="t">' + esc(tx({en:c.label_en, zh:c.label_zh}, l)) + '</div></div>';
    });
    wrap.innerHTML = html;
  }

  function setLens(name) {
    LENS = name;
    var btns = document.querySelectorAll(".sf-lens-btn");
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle("active", btns[i].getAttribute("data-lens") === name);
    render();
  }

  function boot(data) {
    DATA = data;
    LAYOUT = computeLayout(DATA);
    var hint = document.getElementById("sfHint");
    if (hint) hint.textContent = T[lang()].hint;
    var bar = document.getElementById("sfLensbar");
    if (bar) {
      bar.addEventListener("click", function (ev) {
        var b = ev.target.closest(".sf-lens-btn"); if (b) setLens(b.getAttribute("data-lens"));
      });
    }
    renderChainStepper();
    render();
    document.addEventListener("sf-langchange", function () {
      var h = document.getElementById("sfHint"); if (h) h.textContent = T[lang()].hint;
      renderChainStepper();
      render();
    });
    window.addEventListener("resize", function () { hideTip(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    fetch("data/graph_spec.json")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(boot)
      .catch(function (err) {
        var host = document.getElementById("sfGraph");
        if (host) host.innerHTML = '<p style="padding:24px;color:var(--muted)">The genealogy graph loads from <code>data/graph_spec.json</code>. Serve this page over http (e.g. a local server or GitHub Pages) rather than opening the file directly. (' + esc(err.message) + ')</p>';
      });
  });
})();
