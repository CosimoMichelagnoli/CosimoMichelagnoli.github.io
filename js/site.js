/* ==========================================================================
   site.js — progressive-enhancement layer for cosimomichelagnoli.github.io
   Loaded after coder.min.js. Everything here degrades gracefully: if an
   expected element isn't on the page, the relevant init function is a no-op.
   ========================================================================== */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- typewriter (hero prompt lines) ---------------- */
  function initTypewriter() {
    var targets = document.querySelectorAll("[data-typewriter]");
    if (!targets.length) return;
    targets.forEach(function (el) {
      var text = el.textContent;
      if (reducedMotion) return; // leave text as-is, no animation
      el.textContent = "";
      var i = 0;
      (function step() {
        el.textContent = text.slice(0, i);
        i++;
        if (i <= text.length) setTimeout(step, 30);
      })();
    });
  }

  /* ---------------- scroll reveal ---------------- */
  function initReveal() {
    var els = document.querySelectorAll(".bento-card, .stat-card, .timeline-item, .cert-card");
    if (!els.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach(function (el, idx) {
      el.classList.add("reveal");
      el.style.transitionDelay = (idx % 4) * 60 + "ms";
      io.observe(el);
    });
  }

  /* ---------------- command palette (Ctrl/Cmd+K) ---------------- */
  var CMDS = [
    { label: "Home", hint: "~/", href: "/" },
    { label: "About", hint: "cat about.md", href: "/about/" },
    { label: "Education", hint: "ls ./education", href: "/education/" },
    { label: "Story", hint: "cat story.log", href: "/story/" },
    { label: "CV", hint: "cat cv.txt", href: "/cv/" },
    { label: "GitHub", hint: "github.com/CosimoMichelagnoli", href: "https://github.com/CosimoMichelagnoli", external: true },
    { label: "LinkedIn", hint: "in/cosimomichelagnoli", href: "https://www.linkedin.com/in/cosimomichelagnoli/", external: true },
    { label: "Email me", hint: "mailto", href: "mailto:michelagnolicosimo@gmail.com" },
    { label: "Toggle theme", hint: "light / dark", action: "toggle-theme" }
  ];

  function initCommandPalette() {
    var overlay = document.getElementById("cmdk");
    var input = document.getElementById("cmdk-input");
    var results = document.getElementById("cmdk-results");
    var trigger = document.getElementById("cmdk-trigger");
    if (!overlay || !input || !results) return;

    var active = 0;
    var lastFocused = null;

    function filtered() {
      var q = input.value.trim().toLowerCase();
      if (!q) return CMDS;
      return CMDS.filter(function (c) {
        return c.label.toLowerCase().indexOf(q) !== -1 || c.hint.toLowerCase().indexOf(q) !== -1;
      });
    }

    function render() {
      var list = filtered();
      results.innerHTML = "";
      if (!list.length) {
        var empty = document.createElement("li");
        empty.className = "cmdk-empty";
        empty.textContent = "No matches — try 'help'.";
        results.appendChild(empty);
        return;
      }
      list.forEach(function (cmd, idx) {
        var li = document.createElement("li");
        li.textContent = cmd.label;
        var hint = document.createElement("span");
        hint.className = "cmdk-hint";
        hint.textContent = cmd.hint;
        li.appendChild(hint);
        if (idx === active) li.classList.add("active");
        li.addEventListener("mouseenter", function () {
          active = idx;
          highlight();
        });
        li.addEventListener("click", function () {
          run(cmd);
        });
        results.appendChild(li);
      });
    }

    function highlight() {
      Array.prototype.forEach.call(results.children, function (li, idx) {
        li.classList.toggle("active", idx === active);
      });
    }

    function run(cmd) {
      if (cmd.action === "toggle-theme") {
        var toggle = document.getElementById("dark-mode-toggle");
        if (toggle) toggle.click();
        close();
        return;
      }
      if (cmd.external) window.open(cmd.href, "_blank", "noopener");
      else window.location.href = cmd.href;
    }

    function open() {
      lastFocused = document.activeElement;
      overlay.hidden = false;
      input.value = "";
      active = 0;
      render();
      setTimeout(function () {
        input.focus();
      }, 0);
    }

    function close() {
      overlay.hidden = true;
      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    }

    input.addEventListener("input", function () {
      active = 0;
      render();
    });
    input.addEventListener("keydown", function (e) {
      var list = filtered();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        active = Math.min(active + 1, list.length - 1);
        highlight();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        active = Math.max(active - 1, 0);
        highlight();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (list[active]) run(list[active]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    if (trigger) trigger.addEventListener("click", open);
    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (overlay.hidden) open();
        else close();
      } else if (e.key === "Escape" && !overlay.hidden) {
        close();
      }
    });
  }

  /* ---------------- interactive home terminal ---------------- */
  function initHomeTerminal() {
    var log = document.getElementById("term-log");
    var input = document.getElementById("term-input");
    if (!log || !input) return;

    var history = [];
    var histPos = 0;

    function print(text, cls) {
      var span = document.createElement("span");
      span.className = cls || "out";
      span.textContent = text;
      log.appendChild(span);
    }
    function scrollToEnd() {
      log.scrollTop = log.scrollHeight;
    }
    function navigate(href) {
      print("opening " + href + " ...");
      setTimeout(function () {
        window.location.href = href;
      }, 250);
    }

    var ROUTES = {
      whoami: function () {
        print("Offensive Cybersecurity Analyst @ Iliad Italia");
      },
      about: function () {
        navigate("/about/");
      },
      education: function () {
        navigate("/education/");
      },
      story: function () {
        navigate("/story/");
      },
      cv: function () {
        navigate("/cv/");
      },
      contact: function () {
        print("michelagnolicosimo@gmail.com · linkedin.com/in/cosimomichelagnoli");
      },
      github: function () {
        window.open("https://github.com/CosimoMichelagnoli", "_blank", "noopener");
      },
      linkedin: function () {
        window.open("https://www.linkedin.com/in/cosimomichelagnoli/", "_blank", "noopener");
      },
      clear: function () {
        log.innerHTML = "";
      },
      theme: function () {
        var toggle = document.getElementById("dark-mode-toggle");
        if (toggle) toggle.click();
        print("theme toggled");
      },
      history: function () {
        print(history.length ? history.join(", ") : "no history yet");
      },
      help: function () {
        print("available: whoami, about, education, story, cv, contact, github, linkedin, theme, history, clear");
        print("tip: press Tab to autocomplete, ↑/↓ for history");
      }
    };
    var ALIASES = {
      "cd about": "about",
      "cd /about": "about",
      "cd education": "education",
      "cd /education": "education",
      "cd story": "story",
      "cd /story": "story",
      "cd cv": "cv",
      "cd /cv": "cv",
      "open github": "github",
      "open linkedin": "linkedin",
      "ls": "help",
      "?": "help"
    };

    function run(raw) {
      var cmd = raw.trim().toLowerCase();
      print(cmd || " ", "cmd");
      if (!cmd) {
        scrollToEnd();
        return;
      }
      if (ALIASES[cmd]) cmd = ALIASES[cmd];
      if (ROUTES[cmd]) ROUTES[cmd]();
      else print('command not found: "' + cmd + '" — try "help"');
      scrollToEnd();
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var val = input.value;
        if (val.trim()) {
          history.push(val);
          histPos = history.length;
        }
        run(val);
        input.value = "";
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (histPos > 0) {
          histPos--;
          input.value = history[histPos];
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (histPos < history.length - 1) {
          histPos++;
          input.value = history[histPos];
        } else {
          histPos = history.length;
          input.value = "";
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        var val = input.value.trim().toLowerCase();
        if (!val) return;
        var candidates = Object.keys(ROUTES).filter(function (k) {
          return k.indexOf(val) === 0;
        });
        if (candidates.length === 1) input.value = candidates[0];
        else if (candidates.length > 1) print(candidates.join("  "));
      }
    });
  }

  /* ---------------- cursor glow (desktop, motion-safe) ---------------- */
  function initCursorGlow() {
    if (reducedMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return; // skip touch/coarse pointers
    var glow = document.createElement("div");
    glow.className = "cursor-glow";
    document.body.appendChild(glow);
    var raf = null;
    window.addEventListener("mousemove", function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        glow.style.setProperty("--x", e.clientX + "px");
        glow.style.setProperty("--y", e.clientY + "px");
        glow.classList.add("active");
        raf = null;
      });
    });
    window.addEventListener("mouseleave", function () {
      glow.classList.remove("active");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTypewriter();
    initReveal();
    initCommandPalette();
    initHomeTerminal();
    initCursorGlow();
  });
})();
