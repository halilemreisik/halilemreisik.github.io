// Halil Emre Işık · personal site. Vanilla JS, no dependencies:
// language switch, tab rail, flip cards and the photo lightbox.
(function () {
  const root = document.documentElement;
  const LANGS = ["tr", "en", "de"];

  // ---- language ----
  // All three languages live in the HTML; CSS hides the inactive ones.
  const langButtons = Array.from(document.querySelectorAll(".lang-toggle button"));
  function readSavedLang() {
    try { return localStorage.getItem("hei-lang"); } catch (e) { return null; }
  }
  function setLang(lang, save) {
    if (LANGS.indexOf(lang) < 0) lang = "en";
    root.dataset.lang = lang;
    root.lang = lang;
    langButtons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.set === lang)); });
    const t = document.querySelector('meta[name="title-' + lang + '"]');
    if (t) document.title = t.content;
    if (save) { try { localStorage.setItem("hei-lang", lang); } catch (e) {} }
  }
  const nav = (navigator.language || "").toLowerCase().slice(0, 2);
  setLang(readSavedLang() || (LANGS.indexOf(nav) >= 0 ? nav : "en"), false);
  langButtons.forEach(function (b) {
    b.addEventListener("click", function () {
      setLang(b.dataset.set, true);
      window.dispatchEvent(new Event("resize")); // text lengths changed: refit tabs and spines
    });
  });

  // ---- tab rail ----
  // Each tab's height follows its chapter's length; the tab of the chapter in view sticks out.
  const tabs = Array.from(document.querySelectorAll(".rail a"));
  const theme = document.querySelector('meta[name="theme-color"]');
  const chapters = tabs.map(function (t) { return document.querySelector(t.getAttribute("href")); });
  function sizeTabs() {
    const heights = chapters.map(function (c) { return c ? c.offsetHeight : 1; });
    const min = Math.min.apply(null, heights);
    tabs.forEach(function (t, i) { t.style.setProperty("--extent", (heights[i] / min).toFixed(2)); });
  }
  function markCurrent() {
    const probe = window.innerHeight * 0.4;
    let current = 0;
    chapters.forEach(function (c, i) { if (c && c.getBoundingClientRect().top <= probe) current = i; });
    // The last chapter is short and never reaches the probe line, so the bottom of the page selects it.
    if (window.innerHeight + window.scrollY >= root.scrollHeight - 4) current = chapters.length - 1;
    tabs.forEach(function (t, i) {
      t.classList.toggle("is-current", i === current);
      if (i === current) t.setAttribute("aria-current", "true"); else t.removeAttribute("aria-current");
    });
    // The browser chrome and scrollbar take the current chapter's board colour.
    const board = getComputedStyle(chapters[current]).backgroundColor;
    if (theme && theme.content !== board) { theme.content = board; root.style.scrollbarColor = "#1c1a16 " + board; }
    // On phones the rail is a horizontal strip: keep the current tab in view.
    const rail = tabs[0].parentElement;
    if (rail.scrollWidth > rail.clientWidth) {
      const t = tabs[current];
      rail.scrollLeft = t.offsetLeft - (rail.clientWidth - t.offsetWidth) / 2;
    }
  }
  // A leaf's vertical running head sits between its two punch holes; on a short leaf it would
  // run into the upper hole, so it is dropped there.
  function fitSpines() {
    document.querySelectorAll(".leaf[data-spine-en]").forEach(function (leaf) {
      const text = leaf.getAttribute("data-spine-" + root.dataset.lang) || "";
      const needed = 200 + text.length * 8.2 + 160; // bottom offset + text run + upper hole zone
      leaf.classList.toggle("no-spine", leaf.offsetHeight < needed);
    });
  }
  function refit() { sizeTabs(); fitSpines(); markCurrent(); }
  refit();
  window.addEventListener("resize", refit);
  window.addEventListener("scroll", markCurrent, { passive: true });
  window.addEventListener("load", refit);

  // ---- flip cards ----
  const narrow = window.matchMedia("(max-width: 760px)");
  const flips = Array.from(document.querySelectorAll(".flip"));
  flips.forEach(function (card) {
    const front = card.querySelector(".front");
    const back = card.querySelector(".back");
    const buttons = card.querySelectorAll(".flip-btn");
    function show(flipped) {
      card.classList.toggle("is-flipped", flipped);
      buttons[0].setAttribute("aria-pressed", String(flipped));
      syncFaces();
      if (!narrow.matches) (flipped ? buttons[1] : buttons[0]).focus({ preventScroll: true });
    }
    // On phones the card does not flip: the same button opens and closes the back in place.
    buttons[0].addEventListener("click", function () { show(narrow.matches ? !card.classList.contains("is-flipped") : true); });
    buttons[1].addEventListener("click", function () { show(false); });
  });
  // Desktop hides the face that is turned away; on phones the front always stays and the back opens under it.
  function syncFaces() {
    flips.forEach(function (card) {
      const flipped = card.classList.contains("is-flipped");
      const buttons = card.querySelectorAll(".flip-btn");
      card.querySelector(".front").setAttribute("aria-hidden", String(!narrow.matches && flipped));
      card.querySelector(".back").setAttribute("aria-hidden", String(!flipped));
      buttons[0].tabIndex = !narrow.matches && flipped ? -1 : 0;
      buttons[1].tabIndex = !narrow.matches && flipped ? 0 : -1;
    });
  }
  narrow.addEventListener("change", syncFaces);
  syncFaces();

  // ---- photo lightbox ----
  const lb = document.getElementById("lightbox");
  const shots = Array.from(document.querySelectorAll(".shot"));
  if (lb && shots.length) {
    const img = lb.querySelector("img");
    const cap = lb.querySelector("figcaption");
    let at = 0, opener = null;
    function paint() {
      const s = shots[at];
      const text = s.getAttribute("data-cap-" + root.dataset.lang) || "";
      img.src = s.getAttribute("data-full");
      img.alt = text;
      cap.textContent = String(at + 1).padStart(2, "0") + " / " + shots.length + " · " + text;
    }
    function open(i) { at = i; opener = shots[i]; paint(); lb.hidden = false; document.body.style.overflow = "hidden"; lb.querySelector(".lb-close").focus(); }
    function close() { lb.hidden = true; img.removeAttribute("src"); document.body.style.overflow = ""; if (opener) opener.focus(); }
    function step(d) { at = (at + d + shots.length) % shots.length; paint(); }
    shots.forEach(function (s, i) { s.addEventListener("click", function () { open(i); }); });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", function () { step(-1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { step(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    });
  }
})();
