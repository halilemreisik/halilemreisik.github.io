/* =====================================================================
   Halil Emre Işık — personal site
   main.js  (vanilla, no dependencies)

   Handles:
     1. Light / dark theme toggle  (persisted to localStorage)
     2. Mobile navigation dropdown
     3. Sticky-header border on scroll
     4. Scroll-reveal animations    (respects prefers-reduced-motion)
     5. Active-section highlight in the nav
     6. Current year in the footer
   ===================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;

  /* -------------------- 0. CINEMATIC PAGE REVEAL ------------------- */
  // Triggers letterbox bars to retract; double rAF ensures transition fires
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      document.body.classList.add("loaded");
    });
  });

  /* ----------------------- 1. THEME TOGGLE ------------------------- */
  var toggle = document.getElementById("theme-toggle");

  function syncToggle() {
    var isDark = root.getAttribute("data-theme") === "dark";
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(isDark));
      toggle.setAttribute(
        "aria-label",
        isDark ? "Switch to light theme" : "Switch to dark theme"
      );
    }
  }
  syncToggle();

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      syncToggle();
    });
  }

  // If the user has NOT made an explicit choice, follow the OS as it changes.
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  (mq.addEventListener || mq.addListener).call(
    mq,
    mq.addEventListener ? "change" : undefined,
    function (e) {
      var hasChoice;
      try { hasChoice = localStorage.getItem("theme"); } catch (err) { hasChoice = null; }
      if (!hasChoice) {
        root.setAttribute("data-theme", e.matches ? "dark" : "light");
        syncToggle();
      }
    }
  );

  /* --------------------- 2. MOBILE NAVIGATION ---------------------- */
  var navToggle = document.getElementById("nav-toggle");
  var mobileNav = document.getElementById("mobile-nav");

  function closeMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove("open");
    mobileNav.setAttribute("hidden", "");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
    }
  }

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("open");
      if (open) {
        mobileNav.removeAttribute("hidden");
        navToggle.setAttribute("aria-expanded", "true");
        navToggle.setAttribute("aria-label", "Close menu");
      } else {
        closeMobileNav();
      }
    });
    // Close when a link is tapped
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMobileNav);
    });
    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMobileNav();
    });
  }

  /* ------------------- 3. STICKY HEADER ON SCROLL ------------------ */
  var header = document.querySelector(".site-header");
  var cover = document.querySelector(".hero-cover");
  function onScroll() {
    if (!header) return;
    // Switch from the transparent "over photo" look to the solid bar once
    // the visitor has scrolled near the bottom of the full-screen cover.
    var threshold = cover ? cover.offsetHeight - 90 : 8;
    var past = window.scrollY > threshold;
    header.classList.toggle("scrolled", past);
    header.classList.toggle("at-top", !!cover && !past);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  /* --------------------- 4. SCROLL-REVEAL ------------------------- */
  var reveals = document.querySelectorAll(".reveal");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ------------------ 5. ACTIVE NAV HIGHLIGHT --------------------- */
  var sections = document.querySelectorAll("main section[id]");
  var navLinks = document.querySelectorAll(".nav a");

  if (sections.length && navLinks.length && "IntersectionObserver" in window) {
    var linkFor = {};
    navLinks.forEach(function (a) {
      linkFor[a.getAttribute("href").slice(1)] = a;
    });

    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            navLinks.forEach(function (a) { a.classList.remove("active"); });
            var active = linkFor[entry.target.id];
            if (active) active.classList.add("active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* --------------------- 6. FOOTER YEAR --------------------------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
