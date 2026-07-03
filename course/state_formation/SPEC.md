# SPEC — POLSCI 719 State Formation Course Website

Execution spec for Claude Code. Read this file and `graph_spec.json` in full before writing any code.

## 0. Non-negotiable content rules

1. **`graph_spec.json` is the single source of truth for the genealogy graph.** Do not invent, merge, rename, or delete nodes, edges, stages, lanes, lenses, keywords, or hover texts. Render exactly what is in the file. If something looks wrong, flag it in your summary instead of silently fixing it.
2. **Detail-page content comes only from the user's notes files** (see §5). Do not paraphrase, summarize, "improve," or supplement the notes with your own knowledge of the literature. Extraction and layout only.
3. **No new colors, fonts, or layout systems.** Extract the existing design system from the current course pages (§2) and reuse it. New CSS is allowed only for components that do not exist yet (the graph itself, tooltips, the class-notes block), and must be built from the existing palette/typography variables.
4. **Default language is English.** The bilingual toggle must initialize to EN on every page.

## 1. Project layout

Repository: `elena-xia.github.io`

- Target directory: `course/state_formation/`
- Source notes: `assets/state_formation_sources/` — ten weekly literature notes (docx), three class-notes PDFs (`Feb26_lecture_notes.pdf`, `sng_discussion_final_md.pdf`, `state_formation_Mar_05.pdf`), and `modeling_methodology.md`
- Already in target directory: `reading_list.md`, `graph_spec.json`, this `SPEC.md`

Deliverables inside `course/state_formation/`:

```
index.html              # course intro + interactive genealogy graph
methodology.html        # the research-chain / methods page
data/graph_spec.json    # copied from the delivered file, unmodified
data/literatures.json   # generated from the docx notes (§5)
lit/<node_id>.html      # 40 detail pages, one per reading node
```

## 2. Style reuse (do this FIRST, output for confirmation)

Phase 1 of execution: read `course/index.html` (or equivalent), the other three course pages under `course/`, and their CSS. Produce a short **design-system summary** (banner structure, nav bar markup, fonts, color variables, spacing conventions, how the existing EN/ZH toggle works) and show it to the user for confirmation **before generating any page**.

Requirements:
- Identical banner, font stack, and nav bar as the other three course pages; the nav must link back to `course/` and to the other courses the same way existing pages do.
- Reuse the existing bilingual toggle mechanism if one exists; if the existing pages default to ZH, keep the mechanism but initialize this course's pages to **EN**.
- Bilingual implementation: every translatable element carries both languages (e.g. `data-en` / `data-zh` attributes or paired `<span class="lang-en/zh">`), toggled by one switch in the nav, persisted per session (e.g. `sessionStorage`), defaulting to EN.

## 3. index.html

Two sections:

### 3.1 Course introduction
A short intro block, bilingual. Main line (use this content; polish wording only):
- EN: State formation is not only the history of a violence monopolist expanding extraction; it is the history of turning populations and resources into objects that are visible, taxable, governable, credibly committed to, and capable of cooperation. The course runs a five-segment problem chain — appropriability → war & coercion → agency & monitoring → commitment & compliance → long-run consequences — where each new cluster answers the question the previous one could not.
- ZH: 国家形成不只是暴力垄断者不断扩大汲取的历史，而是把人口与资源转化为可见、可征、可管、可承诺、可合作对象的历史。全课沿五段问题链展开——可榨取性 → 战争与强制 → 代理与监控 → 承诺与合规 → 长期后果——每一簇新文献回答的是前一簇无法回答的问题。
- Include one sentence noting the justification–belief lane is sparse in this course but not empty (weeks 11–12), and will later be joined by nodes from other courses. Do not describe it as blank.
- Link to `methodology.html` and to `reading_list.md` (render the reading list as a simple page or link to the raw file, whichever matches existing course-page conventions).

### 3.2 Genealogy graph
Rendering rules (SVG + vanilla JS, no external chart libraries):

- **Grid**: columns = 4 lanes with **unequal widths** per `lanes[].width` (`wide` ≈ 2× `medium` ≈ 3× `narrow`; tune to fit). Rows = stages S0–S5 in `stages[].order`. S0 renders as a visually distinct horizontal band at the top (lighter background tint from the existing palette) spanning all lanes, labeled with its bilingual name — it is a theory/global-panel band, not a time period.
- **Nodes**: rounded rectangles labeled "FirstAuthor Year" (from `citation_en`; e.g. "Dell et al. 2018" — use first author + et al. when 3+ authors, both authors when 2). Node sits in its `stage` × `lane` cell. If `lane_reach` is non-empty, draw a subtle short stub/tick toward each reached lane (not a full edge). Within a cell, order nodes by year.
- **Persistence marker**: nodes with `"persistence": true` get a small downward arrow glyph with tooltip label EN "traces consequences to the present" / ZH "追踪后果至当代".
- **Ghost node** (`type: "anchor_ghost"`, only `weber`): gray, dashed border, no link, tooltip only.
- **Meta node** (`special_render: "meta_method"`, only `arroyomaurer2021`): render with a distinct outline (e.g. double border) at the margin of the S0 band; it audits segment E.
- **Edges**: draw by `kind`:
  - `trunk` (the 5-segment chain, `segment` field): thickest stroke, one accent color from the existing palette; render the chain label (from `problem_chain`) alongside.
  - `lane_evolution`: normal stroke.
  - `suture`: dashed, spans lanes.
  - `feedback`: dashed with arrowheads on both ends.
  - `meta`: dotted.
  - `anchor_link`: thin gray.
  - Every edge shows its bilingual `keyword` as a small label near the midpoint; hovering the edge or its label opens a tooltip with the bilingual `hover` text.
- **Interaction**: click node → navigate to `lit/<node_id>.html` (ghost node not clickable). Hover node → tooltip with `citation` + `tooltip` text in the active language. **Mobile**: hover is unavailable — first tap opens the tooltip (with a "open page →" link inside), second tap or the link navigates; edges/labels are tappable the same way. Test at 375 px width.
- **Lens toggle bar** above the graph: buttons `[Chain (default)] [Methodology] [Legitimacy] [Tilly]`. Lenses **recolor/badge nodes and highlight relevant edges only — never reposition anything**:
  - Chain: default coloring by lane; trunk edges emphasized.
  - Methodology: color nodes by primary (first) `tags.method` value; show a legend built from `lenses.method.values` actually present; display `lenses.method.note` as a caption under the graph.
  - Legitimacy: highlight nodes with non-empty `tags.legitimacy` (badge by value), dim others; show `lenses.legitimacy.note` as caption.
  - Tilly: highlight nodes with non-empty `tags.tilly` using distinct badges for supports/qualifies/challenges/extends/anchor/precursor, dim others; emphasize edges whose source or target is `tilly1992`; caption from `lenses.tilly.note`.
- Layout must be computed from the JSON (no hand-placed coordinates in code), so future nodes can be added by editing the JSON alone.

## 4. methodology.html

Static bilingual page, same chrome. Content sources, in order:
1. The five-link research chain as section headers: problem construction → concept & measurement → theory & mechanism → testing & identification → limitations & extrapolation (问题构建 → 概念与测量 → 理论与机制 → 检验与识别 → 局限与外推).
2. `modeling_methodology.md` from `assets/state_formation_sources/` — fold its content under the appropriate sections (this file was unreadable when the spec was drafted; read it fresh).
3. The `methodology_page_topics_*` fields of each entry in `class_notes_files` in `graph_spec.json` — render as short subsections attributed to the corresponding lecture dates.
4. The methodology lens note (`lenses.method.note`) as the page epigraph.
Do not add methodological commentary of your own.

## 5. Data pipeline: notes → literatures.json → detail pages

### 5.1 Parsing
Parse the ten docx files in `assets/state_formation_sources/`. Two format families exist:
- Weeks 2/5/9 (converted from xlsx): sections marked `**Reading One**` … `**Reading Four**` with bold field headers (`Literature Name`, `Author(s)`, `Publication Year`, `Dependent Variable (DV)`, `Independent Variable (IV)`, `Stateness`, `Core Argument`, `Mechanisms`, `Data`, `Methods`, `Contribution`, `Suggestions`, `Extensions`). Paragraphs mix EN and ZH inside the same field — keep them together as-is; do not attempt to split languages.
- Weeks 3/4/6/8/11/12/13: bilingual headers like `Literature Name / 文献名称`, fields often ordered slightly differently, with explicit `English:` / `中文：` paragraphs. Map onto the same schema.

Output `data/literatures.json`: one record per node_id with fields `{name, authors, year, dv, iv, stateness, argument, mechanisms, data, methods, contribution, suggestions, extensions}`, each field holding the raw bilingual text (arrays of paragraphs). Match records to `graph_spec.json` node ids by week + reading order; verify against each node's `citation_en` and stop with an error report if any mismatch.

**Spot-check requirement**: after parsing, print the extracted `name/authors/year` for all four readings of weeks 2, 5, and 9 (the xlsx-converted files, highest corruption risk) for the user to eyeball before generating pages.

### 5.2 Detail page template (`lit/<node_id>.html`)
Same chrome + bilingual toggle. Sections, in order:
1. Header: full citation (EN + ZH), week number, lane + stage labels, lens badges (method/legitimacy/tilly/persistence) rendered as small chips.
2. Overview strip: DV | IV | Stateness (three-column on desktop, stacked on mobile).
3. Core Argument. 4. Mechanisms. 5. Data & Methods (merge the two fields under one heading, two subheadings). 6. Contribution. 7. Limitations & Extensions (merge `suggestions` + `extensions` under two subheadings).
4. **Class Notes block** — only for nodes with a `class_notes` array: a visually distinct callout (left accent border + tinted background from existing palette, header EN "Class Notes" / ZH "课堂笔记"). Content: extract from the mapped PDF(s) the passages concerning this reading (each PDF is per-week lecture notes; segment by the reading it discusses). `sng_discussion_final_md.pdf` maps entirely to `sng2014`; render its 12 points as a list inside the block. Mark the source file and date at the block's foot. If clean per-reading segmentation of a PDF proves unreliable, include the whole week's notes in each of that week's nodes under a collapsed `<details>` element rather than mis-attributing fragments.
5. Footer nav: back to graph; prev/next reading within the same week.

## 6. QA checklist (run before finishing)

- [ ] All 40 detail pages exist; every graph node (except weber) links to a live page; no 404s among internal links.
- [ ] Language toggle: every page loads in EN; toggling flips all visible text including graph labels, tooltips, edge keywords, lens captions.
- [ ] Graph renders correctly at 375 px (mobile) and ≥1200 px; tap-to-tooltip works on touch; no hover-only content is unreachable on mobile.
- [ ] Lens switching changes colors/badges/edge emphasis only; node positions identical across lenses.
- [ ] literatures.json spot-check output shown for weeks 2/5/9; all 40 records matched to node ids.
- [ ] Banner/nav/typography visually identical to the other three course pages; nav links between courses work both ways.
- [ ] No content in any page that does not originate from graph_spec.json, the notes files, the class-notes PDFs, or reading_list.md.

## 7. Suggested execution phases

1. Read course/ styles → output design-system summary → **pause for user confirmation**.
2. Parse docx → `data/literatures.json` → **print week 2/5/9 spot-check, pause**.
3. Build index.html with the graph from `data/graph_spec.json`.
4. Generate the 40 detail pages + methodology.html; extract class-notes blocks from the PDFs.
5. Run the QA checklist, report results.
