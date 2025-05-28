// ======================================================
// CURSEUR PERSONNALISÉ & TRAIL
// ======================================================

const CustomCursor = {
  element: null,
  hasMoved: false,

  init() {
    this.element = document.createElement("div");
    this.element.id = "custom-cursor";
    this.element.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    transform: translate(0, 0);
    opacity: 0;
    pointer-events: none;
    z-index: 9;
    width: 20px;
    height: 20px;
    margin-left: -10px;
    margin-top: -10px;
    border-radius: 50%;
    background-color: #FF5F35;
  `;
    document.body.appendChild(this.element);
  },

  update(x, y) {
    this.element.style.transform = `translate(${x}px, ${y}px)`;
    if (!this.hasMoved) {
      this.element.style.opacity = 1;
      this.hasMoved = true;
    }
  },

  hide() {
    this.element?.classList.add("hidden");
  },

  show() {
    this.element?.classList.remove("hidden");
  },
};

const TrailCursor = {
  canvas: null,
  context: null,
  pointer: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  trail: [],
  trailDuration: 75,
  animationFrameId: null,

  init() {
    this.canvas = document.createElement("canvas");
    this.canvas.classList.add("cursor-canvas");
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      z-index: 8;
      pointer-events: none;
      transition: opacity 0.15s ease;
    `;
    document.body.appendChild(this.canvas);

    this.context = this.canvas.getContext("2d");
    this.context.imageSmoothingEnabled = true;

    this.resize();
    this.addListeners();
    this.animate();
  },

  resize() {
    this.canvas.width = window.innerWidth * window.devicePixelRatio;
    this.canvas.height = window.innerHeight * window.devicePixelRatio;
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.scale(window.devicePixelRatio, window.devicePixelRatio);
  },

  addListeners() {
    window.addEventListener("resize", () => this.resize());
  },

  onPointerMove(x, y) {
    this.pointer.x = x;
    this.pointer.y = y;
    const now = performance.now();

    const last = this.trail[0];
    if (!last || last.x !== x || last.y !== y) {
      // Ajout direct du point sans interpolation
      this.trail.unshift({
        x,
        y,
        time: now,
      });
      this.trail = this.trail.slice(0, 80); // conserver un buffer limité
    }
  },
  drawTrail() {
    if (this.canvas.classList.contains("hidden")) {
      this.context.clearRect(
        0,
        0,
        this.canvas.width / window.devicePixelRatio,
        this.canvas.height / window.devicePixelRatio
      );
      return;
    }

    const ctx = this.context;
    const now = performance.now();
    this.trail = this.trail.filter((p) => now - p.time < this.trailDuration);

    ctx.clearRect(
      0,
      0,
      this.canvas.width / window.devicePixelRatio,
      this.canvas.height / window.devicePixelRatio
    );

    if (this.trail.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(this.trail[0].x, this.trail[0].y);

    for (let i = 1; i < this.trail.length - 1; i++) {
      const p1 = this.trail[i];
      const p2 = this.trail[i + 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
    }

    const last = this.trail[this.trail.length - 1];
    ctx.lineTo(last.x, last.y);

    ctx.strokeStyle = "#FF5F35";
    ctx.lineWidth = 20;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  },

  animate() {
    this.drawTrail();
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  },

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.canvas?.classList.add("hidden");
  },

  hide() {
    this.canvas?.classList.add("hidden");
  },

  show() {
    this.canvas?.classList.remove("hidden");
  },
};

// =============================
// GESTION DES MOUVEMENTS
// =============================
window.addEventListener("mousemove", (e) => {
  CustomCursor.update(e.clientX, e.clientY);
  TrailCursor.onPointerMove(e.clientX, e.clientY);
});

window.addEventListener("touchmove", (e) => {
  const touch = e.touches[0];
  CustomCursor.update(touch.clientX, touch.clientY);
  TrailCursor.onPointerMove(touch.clientX, touch.clientY);
});

// =============================
// DELEGATION HOVER
// =============================
document.body.addEventListener("mouseover", (e) => {
  if (e.target.closest("button, a, .hover-target")) {
    TrailCursor.hide();
    CustomCursor.hide();
  }
});
document.body.addEventListener("mouseout", (e) => {
  if (e.target.closest("button, a, .hover-target")) {
    TrailCursor.show();
    CustomCursor.show();
  }
});

// =============================
// INITIALISATION
// =============================
function startCursorEffects() {
  CustomCursor.init();
  TrailCursor.init();
}

if (document.readyState !== "loading") {
  startCursorEffects();
} else {
  document.addEventListener("DOMContentLoaded", startCursorEffects);
}

// ======================================================
// ANIMATION DE TRANSITION DE PAGE
// ======================================================
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const overlay = document.querySelector(".page-transition");

// 🧹 Reset propre de l'overlay
function resetOverlay() {
  gsap.set(overlay, {
    display: "none",
    height: "0vh",
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    zIndex: 9999,
  });
}

// 🧭 Animation d’entrée de page
function playEnterTransition() {
  gsap.set(overlay, { display: "block", height: "100vh" });
  gsap.to(overlay, {
    height: "0vh",
    duration: 0.5,
    ease: "power4.inOut",
    onComplete: () => {
      gsap.set(overlay, { display: "none" });
    },
  });
}

// 🧭 Animation de sortie avant navigation
function playExitTransition(href) {
  gsap.set(overlay, {
    display: "block",
    height: "0vh",
  });

  gsap.to(overlay, {
    height: "100vh",
    duration: 0.5,
    ease: "power4.inOut",
    onComplete: () => {
      window.location.href = href;
    },
  });
}

// DOM ready
document.addEventListener("DOMContentLoaded", function () {
  resetOverlay();
  playEnterTransition();
});

// Liens cliqués
document.querySelectorAll("a[href]").forEach((link) => {
  link.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (!href.startsWith("#") && !this.hasAttribute("target")) {
      e.preventDefault();
      if (TrailCursor && typeof TrailCursor.stop === "function") {
        TrailCursor.stop();
      }
      playExitTransition(href);
    }
  });
});

// Retour arrière (slide-back ou bouton retour)
window.addEventListener("popstate", () => {
  resetOverlay();
  playEnterTransition();
});

// Rechargement depuis cache (iOS ou Chrome bfcache)
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    resetOverlay();
    playEnterTransition();
  }
});
