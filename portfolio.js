// ======================================================
// 1. CONSTANTES
// ======================================================
const canvas = document.querySelector("#canvas-target");

const THICKNESS = 600;
const FALL_HEIGHT = -350;

const PAGE_CONFIG = {
  home: {
    selector:
      "#matter-path-1, #matter-path-2-outer, #matter-path-2-inner, #matter-path-3, #matter-path-4-body, #matter-path-4-dot, #matter-path-5",
    colorMap: {
      "matter-path-1": "#00BA95",
      "matter-path-2-outer": "#FFB81E",
      "matter-path-2-inner": "#FEEDD4",
      "matter-path-3": "#0094DE",
      "matter-path-4-body": "#FF5F35",
      "matter-path-4-dot": "#FF5F35",
      "matter-path-5": "#00BA95",
    },
    compoundPaths: {
      "matter-path-2-outer": ["matter-path-2-outer", "matter-path-2-inner"],
    },
  },
};

const DEFAULT_BODY_OPTIONS = {
  restitution: 0.5,
  friction: 0,
  frictionStatic: 0,
  frictionAir: 0.02,
  density: 0.001,
  sleepThreshold: 30,
};

// ======================================================
// 2. MODULES MATTER.JS
// ======================================================
let {
  Engine,
  Render,
  Runner,
  Bodies,
  Composite,
  Mouse,
  MouseConstraint,
  Body,
  Svg,
  Vector,
  Vertices,
} = Matter;

// ======================================================
// 3. INITIALISATION MOTEUR, RENDERER ET RUNNER
// ======================================================
let engine = Engine.create();
engine.timing.timeScale = 1;
engine.enableSleeping = true;
engine.world.gravity.y = 3;
engine.positionIterations = 6;
engine.velocityIterations = 4;

let runner = Runner.create();

let render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    background: "transparent",
    wireframes: false,
    showAngleIndicator: false,
    showSleeping: false,
    showDebug: false,
  },
});

// ======================================================
// 4. CORPS STATIQUES
// ======================================================
let ground, leftWall, rightWall, ceiling;

// ======================================================
// 5. FONCTIONS UTILITAIRES
// ======================================================
function createLettersFromSvg(path, x, y, scaleFactor, options = {}) {
  let verts = Svg.pathToVertices(path, 5);
  verts = Vertices.scale(verts, scaleFactor, scaleFactor);
  const id = path.getAttribute("id");
  const config = PAGE_CONFIG.home;
  const color = config.colorMap[id] || "#000000";

  const body = Bodies.fromVertices(
    x,
    y,
    verts,
    {
      ...DEFAULT_BODY_OPTIONS,
      render: {
        fillStyle: color,
        strokeStyle: color,
        lineWidth: 1,
        ...options.render,
      },
      ...options,
    },
    true
  );
  Body.setMass(body, 80);
  return body;
}

function getDynamicScaleFactor(path) {
  const bounds = path.getBBox();
  const targetWidth = document.documentElement.clientWidth / 11;
  const width = bounds.width || 100;
  const scale = targetWidth / width;
  return Math.max(0.2, Math.min(scale, 1.5));
}

function recreateStaticBodies() {
  const width =
    document.querySelector(".canva-class")?.offsetWidth || window.innerWidth;
  const height = document.documentElement.clientHeight;
  const wallHeight = height * 100;

  // Sécurisation avant suppression
  if (ground) Composite.remove(engine.world, ground);
  if (leftWall) Composite.remove(engine.world, leftWall);
  if (rightWall) Composite.remove(engine.world, rightWall);
  if (ceiling) Composite.remove(engine.world, ceiling);

  // Re-création
  ground = Bodies.rectangle(
    width / 2,
    window.innerWidth < 480
      ? 500
      : window.innerWidth < 768
      ? 600
      : window.innerWidth < 992
      ? 700
      : window.innerWidth < 1280
      ? 800
      : 900,
    width,
    THICKNESS,
    {
      isStatic: true,
      friction: 0,
      frictionStatic: 0,
      render: { visible: false },
    }
  );

  leftWall = Bodies.rectangle(
    -THICKNESS / 2,
    height / 2,
    THICKNESS,
    wallHeight,
    {
      isStatic: true,
      render: { visible: false },
    }
  );

  rightWall = Bodies.rectangle(
    width + THICKNESS / 2,
    height / 2,
    THICKNESS,
    wallHeight,
    {
      isStatic: true,
      render: { visible: false },
    }
  );

  ceiling = Bodies.rectangle(
    width / 2,
    -600 - THICKNESS / 2,
    width,
    THICKNESS,
    {
      isStatic: true,
      friction: 0,
      frictionStatic: 0,
      render: { visible: false },
    }
  );

  Composite.add(engine.world, [ground, leftWall, rightWall, ceiling]);
}

function buildScene() {
  const config = PAGE_CONFIG.home;
  const width =
    document.querySelector(".canva-class")?.offsetWidth || window.innerWidth;
  const height = document.documentElement.clientHeight;

  render.canvas.width = width;
  render.canvas.height = height;
  render.options.width = width;
  render.options.height = height;

  recreateStaticBodies();

  const paths = document.querySelectorAll(config.selector);
  const totalPaths = paths.length;
  const screenWidth = document.documentElement.clientWidth;
  const usableWidth = Math.min(screenWidth, 1000);
  const spacing = usableWidth / totalPaths;
  const offsetX = (screenWidth - usableWidth) / 2;
  const initialY = FALL_HEIGHT;
  let currentIndex = 0;

  for (let i = 0; i < totalPaths; i++) {
    let path = paths[i];
    let id = path.getAttribute("id");
    let xPosition = offsetX + spacing * currentIndex + spacing / 2;
    const scaleFactor = getDynamicScaleFactor(path);

    const compound = config.compoundPaths?.[id];

    if (compound) {
      const elements = compound.map((subId) =>
        document.querySelector(`#${subId}`)
      );
      const parts = elements.map((el) =>
        createLettersFromSvg(el, xPosition, initialY, scaleFactor)
      );

      const compoundBody = Body.create({
        parts: parts.flat(),
        ...DEFAULT_BODY_OPTIONS,
      });

      Body.setMass(compoundBody, 66);
      Body.rotate(compoundBody, (Math.random() - 0.5) * 0.4);
      Composite.add(engine.world, compoundBody);

      currentIndex++;
      i += compound.length - 1;
    } else if (!id.includes("inner")) {
      let yPosition = id.endsWith("dot") ? initialY - 150 : initialY;
      let body = createLettersFromSvg(path, xPosition, yPosition, scaleFactor);
      Composite.add(engine.world, body);
      currentIndex++;
    }
  }
}

function resetSvgBodies() {
  Composite.allBodies(engine.world).forEach((body) => {
    if (!body.isStatic) {
      Composite.remove(engine.world, body);
    }
  });

  requestAnimationFrame(() => buildScene());
}

function checkAndRespawnBodies() {
  const width = render.canvas.width;
  const height = render.canvas.height;

  const bodies = Composite.allBodies(engine.world);
  for (let body of bodies) {
    if (!body.isStatic) {
      const { min, max } = body.bounds;

      const completelyOutOfView = max.x < 0 || min.x > width || min.y > height;

      if (completelyOutOfView) {
        const x = width / 2;
        const y = FALL_HEIGHT + Math.random() * 100;

        Body.setPosition(body, { x, y });
        Body.setVelocity(body, { x: 0, y: 0 });
        Body.setAngularVelocity(body, 0);
        Body.setAngle(body, (Math.random() - 0.5) * Math.PI);
      }
    }
  }
}

// ======================================================
// 6. GRAVITÉ BASÉE SUR LE SCROLL
// ======================================================
let lastScrollY = window.scrollY;
let scrollVelocity = 0;
const damping = 0.85;
const velocityThreshold = -1;
const influenceFactor = 0.02;

window.addEventListener("scroll", () => {
  const currentScrollY = window.scrollY;
  scrollVelocity = currentScrollY - lastScrollY;
  lastScrollY = currentScrollY;
});

Matter.Events.on(engine, "beforeUpdate", () => {
  if (scrollVelocity >= velocityThreshold) return;

  const scrollInfluence = scrollVelocity * influenceFactor;
  if (Math.abs(scrollInfluence) < 0.001) return;

  const bodies = Composite.allBodies(engine.world);
  for (let body of bodies) {
    if (body.isStatic) continue;
    if (body.isSleeping) {
      Matter.Sleeping.set(body, false);
    }
    Body.applyForce(body, body.position, {
      x: 0,
      y: scrollInfluence,
    });
  }

  scrollVelocity *= damping;
});

Matter.Events.on(engine, "beforeUpdate", checkAndRespawnBodies);

// ======================================================
// 7. RÉACTIVITÉ AU REDIMENSIONNEMENT
// ======================================================
let lastWindowWidth = window.innerWidth;
let resizeTimeout;

function resizeCanvas() {
  const width =
    document.querySelector(".canva-class")?.offsetWidth || window.innerWidth;
  const height = document.documentElement.clientHeight;

  render.canvas.width = width;
  render.canvas.height = height;
  render.options.width = width;
  render.options.height = height;

  recreateStaticBodies();

  clearTimeout(resizeCanvas._debounce);
  resizeCanvas._debounce = setTimeout(() => {
    resetSvgBodies();
  }, 200);
}

window.addEventListener("resize", () => {
  const currentWidth = window.innerWidth;
  if (currentWidth === lastWindowWidth) return;
  lastWindowWidth = currentWidth;

  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const bodies = Composite.allBodies(engine.world);
    bodies.forEach((body) => {
      if (!body.isStatic) {
        Composite.remove(engine.world, body);
      }
    });
    requestAnimationFrame(buildScene);
  }, 200);
});

// ======================================================
// 8. INTERACTIONS SOURIS
// ======================================================
let mouse = Mouse.create(render.canvas);
let mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 1,
    damping: 0,
    render: { visible: false },
  },
});
Composite.add(engine.world, mouseConstraint);

const mouseElement = mouseConstraint.mouse.element;
const mouseWheelHandler = mouseConstraint.mouse.mousewheel;

["mousewheel", "DOMMouseScroll", "wheel"].forEach((eventType) => {
  mouseElement.removeEventListener(eventType, mouseWheelHandler);
});
["touchstart", "touchmove"].forEach((eventType) => {
  mouseElement.addEventListener(eventType, () => {}, { passive: true });
});
mouseElement.addEventListener("wheel", () => {}, { passive: true });

// ======================================================
// 9. INITIALISATION DU MONDE
// ======================================================
buildScene();
Runner.run(runner, engine);
Render.run(render);

// ======================================================
// 10. SLIDER SPLIDE
// ======================================================
const splide = new Splide(".splide", {
  perPage: 3,
  perMove: 1,
  gap: "32px",
  padding: "80px",
  pagination: false,
  arrows: false,
  breakpoints: {
    1279: {
      padding: "64px",
      gap: "20px",
    },
    767: {
      perPage: 1,
      padding: "48px",
      gap: "24px",
    },
    479: {
      padding: "40px",
      gap: "20px",
    },
  },
}).mount();

const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

function setButtonState(button, disabled) {
  if (!button) return; // Prevent null error
  button.disabled = disabled;
  button.style.opacity = disabled ? "0.5" : "1";
}

function updateButtons() {
  const index = splide.index;
  const end = splide.Components.Controller.getEnd();

  setButtonState(prevBtn, index === 0);
  setButtonState(nextBtn, index >= end);
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    splide.go("-1");
  });
}
if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    splide.go("+1");
  });
}

splide.on("mounted move", updateButtons);
updateButtons();
