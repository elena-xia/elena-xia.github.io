/* sf-lang.js — shared bilingual toggle for the State Formation course pages.
   Default language is English (SPEC §0.4). Choice persists per session via
   sessionStorage. Two translation mechanisms are supported on every page:
     1. [data-en][data-zh] elements  -> textContent is swapped.
     2. paired .lang-en / .lang-zh spans -> shown/hidden via html[data-lang]
        (used where markup, links, or <em> must survive the switch).
   The graph page listens for the 'sf-langchange' event to re-render SVG labels. */
(function () {
  "use strict";
  var KEY = "sf-lang";
  var lang = "en";
  try {
    var saved = sessionStorage.getItem(KEY);
    if (saved === "en" || saved === "zh") lang = saved;
  } catch (e) {}

  function apply() {
    document.documentElement.setAttribute("data-lang", lang);
    document.documentElement.lang = (lang === "zh" ? "zh" : "en");

    var nodes = document.querySelectorAll("[data-en][data-zh]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var val = lang === "zh" ? el.getAttribute("data-zh") : el.getAttribute("data-en");
      if (val !== null) el.textContent = val;
    }
    var btns = document.querySelectorAll("[data-lang-toggle]");
    for (var j = 0; j < btns.length; j++) {
      btns[j].textContent = lang === "zh" ? "English" : "中文";
      btns[j].setAttribute("aria-label", lang === "zh" ? "Switch to English" : "切换到中文");
    }
    document.dispatchEvent(new CustomEvent("sf-langchange", { detail: { lang: lang } }));
    setupCollapse();   // re-detect overflow: EN/ZH card lengths differ
  }

  // ---- collapsible overview cards (detail pages only; no-op elsewhere) ----
  function toggleLabel(open) {
    return open ? (lang === "zh" ? "收起" : "Show less")
                : (lang === "zh" ? "展开" : "Show more");
  }
  function setBtn(btn, open) {
    btn.setAttribute("data-en", open ? "Show less" : "Show more");
    btn.setAttribute("data-zh", open ? "收起" : "展开");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.textContent = toggleLabel(open);
  }
  function setupCollapse() {
    var cards = document.querySelectorAll(".overview-strip .ov");
    for (var i = 0; i < cards.length; i++) {
      (function (ov) {
        var open = ov.classList.contains("is-open");
        var btn = ov.querySelector(".ov-toggle");
        // measure against the clamp with the card forced closed
        ov.classList.add("is-collapsible");
        ov.classList.remove("is-open");
        var overflowing = ov.scrollHeight > ov.clientHeight + 4;
        if (!overflowing) {
          ov.classList.remove("is-collapsible");
          if (btn) btn.parentNode.removeChild(btn);
          return;
        }
        if (!btn) {
          btn = document.createElement("button");
          btn.type = "button";
          btn.className = "ov-toggle";
          btn.addEventListener("click", function () {
            setBtn(btn, ov.classList.toggle("is-open"));
          });
          ov.appendChild(btn);
        }
        if (open) ov.classList.add("is-open");
        setBtn(btn, open);
      })(cards[i]);
    }
  }
  var rsz;
  window.addEventListener("resize", function () {
    clearTimeout(rsz);
    rsz = setTimeout(setupCollapse, 150);
  });
  window.addEventListener("load", setupCollapse);   // re-measure once fonts have loaded

  function toggle() {
    lang = lang === "zh" ? "en" : "zh";
    try { sessionStorage.setItem(KEY, lang); } catch (e) {}
    apply();
  }

  // expose current language for the graph script
  window.sfLang = function () { return lang; };

  document.addEventListener("DOMContentLoaded", function () {
    var btns = document.querySelectorAll("[data-lang-toggle]");
    for (var i = 0; i < btns.length; i++) btns[i].addEventListener("click", toggle);
    apply();
  });
  // set the attribute as early as possible to avoid a flash of the wrong language
  document.documentElement.setAttribute("data-lang", lang);
})();
