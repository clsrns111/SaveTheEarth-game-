const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;
let score = 0;

class Player {
  x: number;
  y: number;
  radius: number;
  color: string;

  constructor(x: number, y: number, radius: number, color: string) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  draw(): void {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

interface velocity {
  x: number;
  y: number;
}

class Projectile {
  public x: number;
  public y: number;
  public radius: number;
  public color: string;
  public velocity: velocity;

  constructor(
    x: number,
    y: number,
    radius: number,
    color: string,
    velocity: velocity
  ) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw(): void {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update(): void {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

class Particle {
  public x: number;
  public y: number;
  public radius: number;
  public color: string;
  public velocity: velocity;
  public alpha: number;

  constructor(
    x: number,
    y: number,
    radius: number,
    color: string,
    velocity: velocity
  ) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1;
  }

  draw(): void {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  update(): void {
    this.draw();
    this.velocity.x *= 0.99;
    this.velocity.y *= 0.99;
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.alpha -= 0.01;
  }
}

class Enemy {
  public x: number;
  public y: number;
  public radius: number;
  public color: string;
  public velocity: velocity;

  constructor(
    x: number,
    y: number,
    radius: number,
    color: string,
    velocity: velocity
  ) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw(): void {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update(): void {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

const point_x: number = canvas.width / 2;
const point_y: number = canvas.height / 2;

const projectiles: Projectile[] = [];
const enemies: Enemy[] = [];
const particles: Particle[] = [];

const player = new Player(point_x, point_y, 1, "red");
player.draw();

let animationId;

function animate() {
  animationId = requestAnimationFrame(() => this.animate());
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  player.draw();

  particles.forEach((el, i) => {
    if (el.alpha <= 0) {
      particles.splice(i, 1);
    } else {
      el.update();
    }
  });

  enemies.forEach((ene_el, ene_i) => {
    ene_el.update();

    const dist = Math.hypot(ene_el.x - player.x, ene_el.y - player.y);
    if (dist - ene_el.radius - player.radius < 1) {
      cancelAnimationFrame(animationId);
    }

    projectiles.forEach((pro_el, pro_i) => {
      pro_el.update();
      if (
        pro_el.radius + pro_el.x < 0 ||
        pro_el.radius + pro_el.y < 0 ||
        pro_el.x > canvas.width + pro_el.radius ||
        pro_el.y > canvas.height + pro_el.radius
      ) {
        projectiles.splice(pro_i, 1);
      }

      const dist = Math.hypot(ene_el.x - pro_el.x, ene_el.y - pro_el.y);
      if (dist - ene_el.radius - pro_el.radius < 1) {
        for (let i = 0; i < ene_el.radius * 2; i++) {
          particles.push(
            new Particle(pro_el.x, pro_el.y, 3, ene_el.color, {
              x: Math.random() - 0.5,
              y: Math.random() - 0.5,
            })
          );
        }

        projectiles.splice(pro_i, 1);
        enemies.splice(ene_i, 1);
      }
    });
  });
}

function spawnEnemies() {
  setInterval(() => {
    const radius = 10;
    let respawn_x;
    let respawn_y;
    if (Math.random() <= 0.5) {
      respawn_x = Math.random() < 0.5 ? -radius : canvas.width + radius;
      respawn_y = Math.random() * canvas.height;
    } else {
      respawn_x = Math.random() * canvas.width;
      respawn_y = Math.random() < 0.5 ? -radius : canvas.height + radius;
    }

    const angle = Math.atan2(point_y - respawn_y, point_x - respawn_x);
    const x = Math.cos(angle);
    const y = Math.sin(angle);

    enemies.push(new Enemy(respawn_x, respawn_y, 20, "yellow", { x, y }));
  }, 1000);
}

addEventListener("click", (e) => {
  const angle = Math.atan2(e.clientY - point_y, e.clientX - point_x);
  const x = Math.cos(angle);
  const y = Math.sin(angle);
  projectiles.push(new Projectile(point_x, point_y, 5, "white", { x, y }));
});

animate();
spawnEnemies();
