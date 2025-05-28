// ======================================================
// 1. CONSTANTES
// ======================================================
const canvas = document.querySelector("#canvas-target");

const THICKNESS = 600;
const FALL_HEIGHT = -350;
const PAGE_CONFIG = {
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
};
const DEFAULT_BODY_OPTIONS = {
  restitution: 0.5,
  friction: 0,
  frictionStatic: 0,
  frictionAir: 0.02,
  density: 0.01,
  sleepThreshold: 30,
};

let dropInterval = null;

// ======================================================
// 2. MODULES
// ======================================================
let Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Mouse = Matter.Mouse,
  MouseConstraint = Matter.MouseConstraint,
  Body = Matter.Body,
  Svg = Matter.Svg,
  Vector = Matter.Vector,
  Vertices = Matter.Vertices;

// ======================================================
// 3. INITIALISATION DU MOTEUR ET DU RENDERER
// ======================================================
// Création du moteur physique
let engine = Engine.create();
engine.timing.timeScale = 1;
engine.enableSleeping = false;
engine.world.gravity.y = 3;
engine.positionIterations = 6;
engine.velocityIterations = 4;

// Création du runner
let runner = Runner.create();

// Création du renderer
let render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    background: "transparent",
    wireframes: false,
    showAngleIndicator: false,
    showSleeping: false,
    showDebug: true,
  },
});

// ======================================================
// 4. AJOUT DES CORPS STATIQUES (SOL, MURS, PLAFOND)
// ======================================================
let ground = Bodies.rectangle(0, 0, 0, 0, {
  isStatic: true,
  friction: 0,
  frictionStatic: 0,
  render: { visible: false },
});
let leftWall = Bodies.rectangle(0, 0, 0, 0, {
  isStatic: true,
  render: { visible: false },
});
let rightWall = Bodies.rectangle(0, 0, 0, 0, {
  isStatic: true,
  render: { visible: false },
});
let ceiling = Bodies.rectangle(0, 0, 0, 0, {
  isStatic: true,
  render: { visible: false },
});

Composite.add(engine.world, [ground, leftWall, rightWall]);

// ======================================================
// 5. LANCEMENT DE LA CRÉATION DE LA SCENE
// ======================================================
buildScene();

// ======================================================
// 6. FONCTIONS UTILES
// ======================================================
function createRoundedBody(
  x,
  y,
  width,
  height,
  radius,
  spritePath,
  imageWidth,
  imageHeight
) {
  const xmlns = "http://www.w3.org/2000/svg";
  const path = document.createElementNS(xmlns, "path");

  const d = `
    M${radius},0
    H${width - radius}
    A${radius},${radius} 0 0 1 ${width},${radius}
    V${height - radius}
    A${radius},${radius} 0 0 1 ${width - radius},${height}
    H${radius}
    A${radius},${radius} 0 0 1 0,${height - radius}
    V${radius}
    A${radius},${radius} 0 0 1 ${radius},0
    Z
  `
    .replace(/\s+/g, " ")
    .trim();

  path.setAttribute("d", d);

  const svg = document.createElementNS(xmlns, "svg");
  svg.appendChild(path);
  document.body.appendChild(svg);
  const vertices = Svg.pathToVertices(path, 13);
  document.body.removeChild(svg);

  const body = Bodies.fromVertices(
    x,
    y,
    [vertices],
    {
      ...DEFAULT_BODY_OPTIONS,
      render: {
        sprite: {
          texture: spritePath,
          xScale: width / imageWidth,
          yScale: height / imageHeight,
        },
      },
    },
    true
  );

  // 🔧 Correction importante : repositionner le centre du corps
  Body.setPosition(body, { x, y });

  return body;
}

function buildScene() {
  if (dropInterval) {
    clearInterval(dropInterval);
    dropInterval = null;
  }

  const width =
    document.querySelector(".canva-class")?.offsetWidth || window.innerWidth;
  const height = canvas.offsetHeight;
  render.canvas.width = width;
  render.canvas.height = height;
  render.options.width = width;
  render.options.height = height;

  recreateStaticBodies();

  const spritePaths = [
    "https://cdn.prod.website-files.com/67e057030b8b4f570a4c61f0/682f9837d144a51c9edcb135_ai.png",
    "https://cdn.prod.website-files.com/67e057030b8b4f570a4c61f0/682f9836a733046cd41202f2_framer.png",
    "https://cdn.prod.website-files.com/67e057030b8b4f570a4c61f0/682f9836e287bd2cb661fca9_rive.png",
    "https://cdn.prod.website-files.com/67e057030b8b4f570a4c61f0/682f9836e287bd2cb661fca6_arc.png",
    "https://cdn.prod.website-files.com/67e057030b8b4f570a4c61f0/682f98367e223e2cec39dde7_webflow.png",
    "https://cdn.prod.website-files.com/67e057030b8b4f570a4c61f0/682f9836affce79de69196a2_figma.png",
    "https://cdn.prod.website-files.com/67e057030b8b4f570a4c61f0/682f983617f70fc476a8d421_jira.png",
    "https://cdn.prod.website-files.com/67e057030b8b4f570a4c61f0/682f9836b24ed053019d96d9_notion.png",
    "https://cdn.prod.website-files.com/67e057030b8b4f570a4c61f0/682f9836ab7bd07309cb880d_lottiefiles.png",
    "https://cdn.prod.website-files.com/67e057030b8b4f570a4c61f0/682f9836c361bfd997c33e96_ps.png",
    "https://cdn.prod.website-files.com/67e057030b8b4f570a4c61f0/682f98363a94db00dbc737f2_chatgpt.png",
    "https://cdn.prod.website-files.com/67e057030b8b4f570a4c61f0/682f98363a99d073781271d9_lr.png",
    "https://cdn.prod.website-files.com/67e057030b8b4f570a4c61f0/682f98363bc5bdd5c9e891e6_claude.png",
    "https://cdn.prod.website-files.com/67e057030b8b4f570a4c61f0/682f98363bc5bdd5c9e891e3_trello.png",
    "https://cdn.prod.website-files.com/67e057030b8b4f570a4c61f0/682f98366e9c7175d9157e15_ae.png",
    "https://cdn.prod.website-files.com/67e057030b8b4f570a4c61f0/682f9836ee2e00ae08a21914_pr.png",
  ];

  const numSprites = spritePaths.length;
  const spacing = width / (numSprites + 1);
  const size = 120;
  const radius = size * 0.3;

  let i = 0;

  dropInterval = setInterval(() => {
    if (i >= numSprites) {
      clearInterval(dropInterval);
      return;
    }

    const x = Math.random() * render.canvas.width;
    const y = FALL_HEIGHT + Math.random() * 30;
    const highResWidth = 512; // largeur réelle du PNG
    const imageWidth = 512; // largeur réelle de ton PNG
    const imageHeight = 512;

    const box = createRoundedBody(
      x,
      y,
      size,
      size,
      radius,
      spritePaths[i],
      imageWidth,
      imageHeight
    );

    Composite.add(engine.world, box);

    i++;
  }, 100);
}

const canvasContainer = document.querySelector(".canva-class");

const resizeObserver = new ResizeObserver(() => {
  resizeCanvasToMatchContainer();
});

resizeObserver.observe(canvasContainer);

function resizeCanvasToMatchContainer() {
  const width = canvasContainer.offsetWidth;
  const height = canvasContainer.offsetHeight;

  render.canvas.width = width;
  render.canvas.height = height;
  render.options.width = width;
  render.options.height = height;

  recreateStaticBodies();

  // Redessiner les sprites
  resetSvgBodies();
}

// Supprimer tous les bodies
function resetSvgBodies() {
  Composite.allBodies(engine.world).forEach((body) => {
    if (!body.isStatic) {
      Composite.remove(engine.world, body);
    }
  });

  requestAnimationFrame(() => buildScene());
}

function getDynamicScaleFactor(path) {
  const bounds = path.getBBox();
  const targetWidth = document.documentElement.clientWidth / 11;
  const width = bounds.width || 100;
  const scale = targetWidth / width;
  return Math.max(0.05, Math.min(scale, 2.5));
}

function recreateStaticBodies() {
  const width =
    document.querySelector(".canva-class")?.offsetWidth || window.innerWidth;
  const height = render.canvas.height;
  const wallHeight = height * 100;

  Composite.remove(engine.world, ground);
  Composite.remove(engine.world, leftWall);
  Composite.remove(engine.world, rightWall);

  const groundThickness = 100; // ou 1 si tu veux un bord quasi inexistant

  ground = Bodies.rectangle(
    width / 2,
    height - groundThickness / 2 + 100,
    width,
    groundThickness,
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

function resizeCanvas() {
  const width =
    document.querySelector(".canva-class")?.offsetWidth || window.innerWidth;
  const height = render.canvas.height;

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

// Fonction pour repositionner les lettres hors du canvas
function checkAndRespawnBodies() {
  const width = render.canvas.width;
  const height = render.canvas.height;

  const bodies = Composite.allBodies(engine.world);
  for (let body of bodies) {
    if (!body.isStatic) {
      const { min, max } = body.bounds;

      const completelyOutOfView = max.x < 0 || min.x > width || min.y > height;

      if (completelyOutOfView) {
        const x = width / 2; // ⬅️ Centré horizontalement
        const y = FALL_HEIGHT + Math.random() * 100;

        Body.setPosition(body, { x, y });
        Body.setVelocity(body, { x: 0, y: 0 });
        Body.setAngularVelocity(body, 0);
        Body.setAngle(body, (Math.random() - 0.5) * Math.PI);
      }
    }
  }
}

// Appelle la fonction à chaque frame
Matter.Events.on(engine, "beforeUpdate", checkAndRespawnBodies);

// ======================================================
// 12. GRAVITÉ BASÉE SUR LE SCROLL (avec réveil des corps)
// ======================================================

let lastScrollY = window.scrollY;
let scrollVelocity = 0;

window.addEventListener("scroll", () => {
  const currentScrollY = window.scrollY;
  scrollVelocity = currentScrollY - lastScrollY;
  lastScrollY = currentScrollY;
});

Matter.Events.on(engine, "beforeUpdate", () => {
  if (scrollVelocity >= 0) return; // Ignore les scrolls trop faibles

  const dynamicBodies = Composite.allBodies(engine.world).filter(
    (body) => !body.isStatic
  );

  const scrollInfluence = scrollVelocity * 0.02;

  dynamicBodies.forEach((body) => {
    // Réveille le corps s'il dort
    if (body.isSleeping) {
      Matter.Sleeping.set(body, false);
    }

    Body.applyForce(body, body.position, {
      x: 0,
      y: scrollInfluence,
    });
  });

  scrollVelocity *= 0.85; // Amortissement
});

// ======================================================
// 8. DÉMARRAGE DU RENDERER & DU RUNNER
// ======================================================
Runner.run(runner, engine);
Render.run(render);

// ======================================================
// 9. GESTION DES INTERACTIONS SOURIS
// ======================================================
let mouse = Mouse.create(render.canvas);
let mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    //stiffness: 0.9,
    stiffness: 1, // très faible
    damping: 0, // pour atténuer les oscillations
    render: { visible: false },
  },
});
Composite.add(engine.world, mouseConstraint);

// Sécurisation : cibler l'élément utilisé par Matter pour les interactions souris
const mouseElement = mouseConstraint.mouse.element;
const mouseWheelHandler = mouseConstraint.mouse.mousewheel;

// Suppression des écouteurs qui bloquent le scroll
["mousewheel", "DOMMouseScroll", "wheel"].forEach((eventType) => {
  mouseElement.removeEventListener(eventType, mouseWheelHandler);
});

// Ajout d'un écouteur passif pour autoriser le scroll (UX et performance)
mouseElement.addEventListener("wheel", () => {}, { passive: true });
