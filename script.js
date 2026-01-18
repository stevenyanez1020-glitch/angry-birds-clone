const {
  Engine,
  Render,
  Runner,
  World,
  Bodies,
  Constraint,
  Mouse,
  MouseConstraint,
  Events
} = Matter;

const engine = Engine.create();
const world = engine.world;

const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: 1000,
    height: 600,
    wireframes: false,
    background: "#87CEEB"
  }
});

Render.run(render);
Runner.run(Runner.create(), engine);

// SUELO
const ground = Bodies.rectangle(500, 580, 1000, 40, {
  isStatic: true,
  render: { fillStyle: "#228B22" }
});

// PLATAFORMA
const platform = Bodies.rectangle(750, 450, 300, 20, {
  isStatic: true,
  render: { fillStyle: "#8B4513" }
});

// PÁJARO
let bird = Bodies.circle(200, 400, 20, {
  density: 0.004,
  restitution: 0.5,
  render: { fillStyle: "red" }
});

// HONDA
const slingPoint = { x: 200, y: 400 };
let sling = Constraint.create({
  pointA: slingPoint,
  bodyB: bird,
  stiffness: 0.02,
  length: 0
});

// BLOQUES
const blocks = [
  Bodies.rectangle(750, 410, 60, 60, { render: { fillStyle: "#DEB887" }}),
  Bodies.rectangle(810, 410, 60, 60, { render: { fillStyle: "#DEB887" }}),
  Bodies.rectangle(780, 350, 140, 20, { render: { fillStyle: "#CD853F" }})
];

// CERDO
const pig = Bodies.circle(780, 380, 20, {
  render: { fillStyle: "green" }
});

World.add(world, [
  ground,
  platform,
  bird,
  sling,
  ...blocks,
  pig
]);

// MOUSE
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.1,
    render: { visible: false }
  }
});
World.add(world, mouseConstraint);
render.mouse = mouse;

// DISPARO
Events.on(mouseConstraint, "enddrag", (event) => {
  if (event.body === bird) {
    setTimeout(() => {
      sling.bodyB = null;
    }, 100);
  }
});

// RESET PÁJARO
Events.on(engine, "afterUpdate", () => {
  if (bird.position.x > 1100 || bird.position.y > 700) {
    World.remove(world, bird);

    bird = Bodies.circle(200, 400, 20, {
      density: 0.004,
      restitution: 0.5,
      render: { fillStyle: "red" }
    });

    sling.bodyB = bird;
    World.add(world, bird);
  }
});