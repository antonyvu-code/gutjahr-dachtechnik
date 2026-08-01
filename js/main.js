/* Gutjahr Dachtechnik — premium interactions
   Progressive enhancement: without GSAP/JS the page stays fully readable. */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;
const hasGSAP = typeof gsap !== "undefined";
const motionOn = hasGSAP && !reduceMotion;

/* ==========================================================
   Basics (run always)
   ========================================================== */

// Mobile nav
const navToggle = document.getElementById("nav-toggle");
const mainNav = document.getElementById("main-nav");

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const open = mainNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  mainNav.addEventListener("click", (e) => {
    if (e.target.matches("a")) {
      mainNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

// Header shadow
const header = document.querySelector(".site-header");
window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 10);
}, { passive: true });

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Contact form → composes an e-mail (static hosting, no backend)
const form = document.getElementById("contact-form");
const note = document.getElementById("form-note");

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const tel = form.tel.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    const callback = form.callback.checked;

    if (!name || !email || !message) {
      note.textContent = "Bitte füllen Sie Name, E-Mail und Mitteilung aus.";
      return;
    }
    const body = [
      `Name: ${name}`,
      `Telefon: ${tel || "—"}`,
      `E-Mail: ${email}`,
      callback ? "Um Rückruf wird gebeten." : "",
      "",
      message,
    ].filter(Boolean).join("\n");

    window.location.href =
      "mailto:info@gutjahr-dachtechnik.de" +
      "?subject=" + encodeURIComponent("Anfrage über die Website") +
      "&body=" + encodeURIComponent(body);
    note.textContent = "Ihr E-Mail-Programm öffnet sich mit der vorbereiteten Nachricht.";
  });
}

/* ==========================================================
   Slate wall — generated shingles, each cut a little different
   ========================================================== */

const slateWall = document.getElementById("slate-wall");
let shingles = [];

if (slateWall) {
  const NS = "http://www.w3.org/2000/svg";
  const tones = ["#39424f", "#343d4a", "#2f3844", "#3d4754", "#333b47", "#414b59"];
  const W = 132, H = 176, COURSE = 96;
  const viewW = 1000, viewH = 820;
  const rows = Math.ceil(viewH / COURSE) + 1;
  const cols = Math.ceil(viewW / W) + 2;

  // bottom course first so upper courses overlap it, like on a real roof
  for (let r = rows - 1; r >= 0; r--) {
    const xShift = (r % 2) * (W / 2) - W;
    for (let c = 0; c < cols; c++) {
      const x = c * W + xShift;
      const y = r * COURSE - (H - COURSE);
      const curve = W * 0.52;
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d",
        `M${x} ${y} h${W} v${H - curve} q0 ${curve} ${-curve} ${curve} h${-(W - curve)} Z`);
      path.setAttribute("fill", tones[Math.floor(Math.random() * tones.length)]);
      path.setAttribute("stroke", "rgba(255,255,255,0.045)");
      path.classList.add("shingle");
      slateWall.appendChild(path);
      shingles.push(path);
    }
  }
}

/* ==========================================================
   Motion layer (GSAP + Lenis) — skipped for reduced motion
   ========================================================== */

if (motionOn) {
  document.documentElement.classList.add("has-motion");
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // the preloader choreography assumes we start at the top
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  // Split and measure only after webfonts arrive — otherwise SplitText slices
  // lines with fallback-font metrics and the text reflows mid-animation.
  // The preloader (visible via CSS as soon as .has-motion is set) covers the wait.
  const fontsReady = document.fonts && document.fonts.ready
    ? document.fonts.ready
    : Promise.resolve();

  fontsReady.then(() => {

  // ---- Lenis smooth scrolling, driven by the GSAP ticker ----
  let lenis = null;
  if (typeof Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    window.lenis = lenis;
  }

  // Anchor links respect the smooth scroller + sticky header offset
  document.querySelectorAll('a[href^="#"], a[href^="index.html#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const hash = a.getAttribute("href").replace("index.html", "");
      const target = hash.length > 1 && document.querySelector(hash);
      if (target && lenis) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -64, duration: 1.2 });
      }
    });
  });

  // ---- Scroll progress bar ----
  const progressBar = document.querySelector(".scroll-progress");
  if (progressBar) {
    gsap.to(progressBar, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
    });
  }

  // ---- Header: hide on scroll down, return on scroll up ----
  const showHeader = gsap.quickTo(header, "yPercent", { duration: 0.4, ease: "power3.out" });
  ScrollTrigger.create({
    start: "top top",
    end: "max",
    onUpdate(self) {
      showHeader(self.direction === 1 && self.scroll() > 320 ? -100 : 0);
    },
  });

  // ---- Preloader → hero entrance choreography ----
  const preloader = document.getElementById("preloader");
  const counter = document.getElementById("preloader-count");
  const heroTitle = document.querySelector(".hero h1");

  // initial states (preloader covers the page, so no flash)
  const heroBits = [".hero .eyebrow", ".hero-lead", ".hero-actions .btn", ".trust-row li", ".hero-scroll"];
  gsap.set(heroBits.join(","), { autoAlpha: 0, y: 26 });
  gsap.set(shingles, { opacity: 0 });

  const split = heroTitle
    ? new SplitText(heroTitle, { type: "chars,words", mask: "chars" })
    : null;
  if (split) gsap.set(split.chars, { yPercent: 115 });

  const intro = gsap.timeline({ defaults: { ease: "power4.out" } });

  if (preloader && counter) {
    const tick = { v: 0 };
    intro
      .to(tick, {
        v: 100, duration: 0.9, ease: "power2.inOut",
        onUpdate: () => (counter.textContent = Math.round(tick.v)),
      })
      .to(preloader, { yPercent: -100, duration: 0.85, ease: "power4.inOut" }, "+=0.1")
      .set(preloader, { display: "none" });
  }

  intro
    .to(shingles, {
      opacity: 1, duration: 0.9, ease: "power1.out",
      stagger: { amount: 1.4, from: "random" },
    }, "-=0.55")
    .add(() => {}, "-=1.2");

  if (split) {
    intro.to(split.chars, {
      yPercent: 0, duration: 1.1,
      stagger: { each: 0.025, from: "start" },
    }, "-=1.25");
  }
  intro
    .to(".hero .eyebrow", { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.9")
    .to(".hero-lead", { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.75")
    .to(".hero-actions .btn", { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.09 }, "-=0.55")
    .to(".trust-row li", { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.07 }, "-=0.45")
    .to(".hero-scroll", { autoAlpha: 1, y: 0, duration: 0.5 }, "-=0.3");

  // ---- Hero parallax: scroll + mouse ----
  const heroSlate = document.querySelector(".hero-slate");
  if (heroSlate) {
    gsap.to(heroSlate, {
      yPercent: 16, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    if (finePointer) {
      const qx = gsap.quickTo(slateWall, "x", { duration: 0.9, ease: "power3.out" });
      const qy = gsap.quickTo(slateWall, "y", { duration: 0.9, ease: "power3.out" });
      document.querySelector(".hero").addEventListener("mousemove", (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        qx(nx * -22);
        qy(ny * -14);
      });
    }
  }

  // ---- Marquee: infinite service ticker ----
  const marqueeTrack = document.getElementById("marquee-track");
  if (marqueeTrack) {
    const loop = gsap.to(marqueeTrack, { xPercent: -50, ease: "none", duration: 30, repeat: -1 });
    marqueeTrack.parentElement.addEventListener("mouseenter", () => gsap.to(loop, { timeScale: 0.25, duration: 0.5 }));
    marqueeTrack.parentElement.addEventListener("mouseleave", () => gsap.to(loop, { timeScale: 1, duration: 0.5 }));
  }

  // ---- Section headings: masked line reveals ----
  document.querySelectorAll("[data-split]").forEach((el) => {
    const s = new SplitText(el, { type: "lines", mask: "lines" });
    gsap.from(s.lines, {
      yPercent: 115, duration: 0.9, ease: "power4.out", stagger: 0.09,
      scrollTrigger: { trigger: el, start: "top 86%", once: true },
    });
  });

  // ---- Generic reveals, batched for stagger ----
  gsap.set(".reveal, .timeline li", { autoAlpha: 0, y: 30 });
  ScrollTrigger.batch(".reveal, .timeline li", {
    start: "top 88%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.09, overwrite: true }),
  });

  // ---- Service card icons: draw strokes when the card arrives ----
  document.querySelectorAll(".card-icon svg").forEach((svg) => {
    const strokes = svg.querySelectorAll("path, rect");
    strokes.forEach((p) => {
      const len = p.getTotalLength ? p.getTotalLength() : 120;
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    gsap.to(strokes, {
      strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut", stagger: 0.12,
      scrollTrigger: { trigger: svg, start: "top 88%", once: true },
    });
  });

  // ---- 3D tilt + copper spotlight on cards ----
  if (finePointer) {
    document.querySelectorAll(".card").forEach((card) => {
      const rx = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3.out" });
      const ry = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3.out" });
      const lift = gsap.quickTo(card, "y", { duration: 0.5, ease: "power3.out" });
      gsap.set(card, { transformPerspective: 700 });

      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", `${px * 100}%`);
        card.style.setProperty("--my", `${py * 100}%`);
        ry((px - 0.5) * 8);
        rx((0.5 - py) * 8);
        lift(-6);
      });
      card.addEventListener("mouseleave", () => { rx(0); ry(0); lift(0); });
    });
  }

  // ---- Magnetic buttons ----
  if (finePointer) {
    document.querySelectorAll(".btn").forEach((btn) => {
      const mx = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3.out" });
      const my = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3.out" });
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.25);
        my((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      btn.addEventListener("mouseleave", () => { mx(0); my(0); });
    });
  }

  // ---- Counters ----
  document.querySelectorAll("[data-count]").forEach((el) => {
    gsap.fromTo(el, { innerText: 0 }, {
      innerText: Number(el.dataset.count),
      duration: 1.8, ease: "power2.out", snap: { innerText: 1 },
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  // ---- Imagery: showcase parallax + media scale reveals ----
  const showcaseImg = document.querySelector(".showcase-media img");
  if (showcaseImg) {
    gsap.fromTo(showcaseImg, { yPercent: -8 }, {
      yPercent: 8, ease: "none",
      scrollTrigger: { trigger: ".showcase", start: "top bottom", end: "bottom top", scrub: true },
    });
  }
  document.querySelectorAll(".media-reveal img").forEach((img) => {
    gsap.fromTo(img, { scale: 1.22 }, {
      scale: 1, duration: 1.5, ease: "power3.out", clearProps: "transform",
      scrollTrigger: { trigger: img, start: "top 86%", once: true },
    });
  });

  // ---- Timeline: progress line drawn by scroll ----
  const tlProgress = document.querySelector(".tl-progress");
  if (tlProgress) {
    gsap.fromTo(tlProgress, { scaleY: 0 }, {
      scaleY: 1, ease: "none", transformOrigin: "top center",
      scrollTrigger: { trigger: ".timeline", start: "top 80%", end: "bottom 55%", scrub: 0.4 },
    });
  }

  // ---- Custom cursor (desktop only) ----
  const dot = document.getElementById("cursor-dot");
  const ring = document.getElementById("cursor-ring");
  if (finePointer && dot && ring) {
    document.documentElement.classList.add("has-cursor");
    const dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power2.out" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power2.out" });
    const rx2 = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
    const ry2 = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });

    window.addEventListener("mousemove", (e) => {
      dx(e.clientX); dy(e.clientY);
      rx2(e.clientX); ry2(e.clientY);
    });
    document.querySelectorAll("a, button, .card").forEach((el) => {
      el.addEventListener("mouseenter", () => document.documentElement.classList.add("cursor-active"));
      el.addEventListener("mouseleave", () => document.documentElement.classList.remove("cursor-active"));
    });
  }

  }); // fontsReady
} else {
  /* ---- Fallback: no GSAP or reduced motion — everything visible ---- */
  const preloader = document.getElementById("preloader");
  if (preloader) preloader.style.display = "none";
  shingles.forEach((s) => (s.style.opacity = 1));

  if (!reduceMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("io-motion");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  }
}
