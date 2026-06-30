/* Shared script for the IR genealogy pages (multi-file: index + week1..week12).
   1. Bilingual toggle — swaps every [data-en][data-zh] element via textContent.
   2. Keyboard ← / → navigation between adjacent week pages (week N is a separate
      HTML file, so we jump files rather than moving an index in an array).
   In-memory language state only (no localStorage / sessionStorage). The chosen
   language is carried across an arrow-key jump via a ?lang= query param so it is
   not reset when a new week file loads. */
(function () {
  "use strict";

  var MIN_WEEK = 1;
  var MAX_WEEK = 12;

  // Seed language from ?lang= (set by an arrow-key jump) so it survives the jump;
  // otherwise default to English.
  function readLangFromURL() {
    try {
      var p = new URLSearchParams(location.search).get("lang");
      if (p === "zh" || p === "en") return p;
    } catch (e) {}
    return null;
  }
  var lang = readLangFromURL() || "en";

  function apply() {
    document.documentElement.lang = lang;
    var nodes = document.querySelectorAll("[data-en][data-zh]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var val = lang === "zh" ? el.getAttribute("data-zh") : el.getAttribute("data-en");
      if (val !== null) el.textContent = val;
    }
    // Toggle button shows the language you can switch TO.
    var btns = document.querySelectorAll("[data-lang-toggle]");
    for (var j = 0; j < btns.length; j++) {
      btns[j].textContent = lang === "zh" ? "English" : "中文";
      btns[j].setAttribute("aria-label", lang === "zh" ? "Switch to English" : "切换到中文");
    }
  }

  function toggle() {
    lang = lang === "zh" ? "en" : "zh";
    apply();
  }

  // ---- arrow-key week navigation ----
  function currentWeek() {
    var m = location.pathname.match(/week(\d+)\.html$/i);
    return m ? parseInt(m[1], 10) : null; // null on the homepage / non-week pages
  }

  function isTypingTarget(el) {
    if (!el) return false;
    if (el.isContentEditable) return true;
    var tag = (el.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select";
  }

  function onKeydown(ev) {
    if (ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey) return; // modifier held
    if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight") return;
    if (isTypingTarget(document.activeElement)) return; // focus in a field
    var wk = currentWeek();
    if (wk === null) return; // not on a week page
    var target = ev.key === "ArrowLeft" ? wk - 1 : wk + 1;
    if (target < MIN_WEEK || target > MAX_WEEK) return; // boundary: do nothing
    ev.preventDefault();
    location.href = "week" + target + ".html?lang=" + lang; // carry language
  }

  document.addEventListener("DOMContentLoaded", function () {
    var btns = document.querySelectorAll("[data-lang-toggle]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", toggle);
    }
    document.addEventListener("keydown", onKeydown);
    apply();
  });
})();
