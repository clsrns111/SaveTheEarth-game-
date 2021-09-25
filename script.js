const canvas = document.getElementById("canvas");
const start_btn = document.getElementById("start_btn");
const re_start_btn = document.getElementById("restart");
const score_text = document.getElementById("score");
const modal_score = document.querySelector(".modal_score");
const sound_i = document.getElementById("sound_i");
const desc = document.querySelector(".desc");
const a = document.querySelector(".alert");
const modal_total_score = document.querySelector(".modal_total_score");
const modal = document.querySelector(".modal");
const power = document.querySelector(".item1");
const speed = document.querySelector(".item2");
const multi = document.querySelector(".item3");
let option = [];
let total_score_text = document.getElementById("total_score");
const start = document.querySelector(".start");
const ctx = canvas.getContext("2d");

start_btn.addEventListener("click", () => {
  start_btn.style.visibility = "hidden";
  start.style.visibility = "hidden";
  start_btn.classList.add("hidden");
  init();
});

//sound
let bgm = new Audio();
let pop = new Audio();

bgm.src = "bgm.mp3";
pop.src = "pop.mp3";

bgm.muted = true;
pop.muted = true;

sound_i.addEventListener("click", () => {
  if (bgm.muted) {
    bgm.muted = false;
    pop.muted = false;
    bgm.play();
    bgm.loop = true;
    bgm.volume = 0.4;
  } else {
    bgm.muted = true;
    pop.muted = true;
  }
});

canvas.width = innerWidth;
canvas.height = innerHeight;

let score = 0;
let total_score = localStorage.getItem("score");

class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

class Projectile {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    if (option.includes("speed")) {
      this.x = this.x + this.velocity.x * 1.2;
      this.y = this.y + this.velocity.y * 1.2;
    }
  }
}

class Particle {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  update() {
    this.draw();
    this.velocity.x *= 0.99;
    this.velocity.y *= 0.99;
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.alpha -= 0.01;
  }
}

class Enemy {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();

    this.hole();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }

  hole() {
    ctx.beginPath();
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.arc(
      this.x - (Math.random() - 13),
      this.y - (Math.random() - 13),
      this.radius / 6,
      0,
      Math.PI * 2,
      false
    );
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.arc(
      this.x + (Math.random() - 17),
      this.y + (Math.random() - 17),
      this.radius / 3,
      0,
      Math.PI * 2,
      false
    );
    ctx.fill();
  }
}

const point_x = canvas.width / 2;
const point_y = canvas.height / 2;
let projectiles = [];
let enemies = [];
let particles = [];
let animationId;

const player = new Player(point_x, point_y, 99, "red");
player.draw();

function animate() {
  animationId = requestAnimationFrame(() => this.animate());
  ctx.fillStyle = "black";
  ctx.clearRect(0, 0, canvas.width, canvas.height);

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
      if (start_btn.className === "hidden") {
        cancelAnimationFrame(animationId);
        bgm.pause();
        localStorage.setItem("score", total_score);
        modal_total_score.textContent = total_score;
        modal_score.textContent = score;
        modal.style.visibility = "visible";
      }
    }

    projectiles.forEach((pro_el, pro_i) => {
      if (pro_el) {
        pro_el.update();
      }

      if (
        pro_el.radius + pro_el.x < 0 ||
        pro_el.radius + pro_el.y < 0 ||
        pro_el.x > canvas.width + pro_el.radius ||
        pro_el.y > canvas.height + pro_el.radius
      ) {
        projectiles.splice(pro_i, 1);
      }

      const dist = Math.hypot(ene_el.x - pro_el.x, ene_el.y - pro_el.y);
      if (dist - ene_el.radius - pro_el.radius < 1.5) {
        setTimeout(() => {
          pop.play();
        }, 0);
      }

      if (dist - ene_el.radius - pro_el.radius < 1) {
        setTimeout(() => {
          pop.play();
        }, 0);
        for (let i = 0; i < ene_el.radius * 2; i++) {
          particles.push(
            new Particle(
              pro_el.x,
              pro_el.y,
              Math.random() * 3 + 2,
              ene_el.color,
              {
                x: (Math.random() - 0.5) * (Math.random() * 20),
                y: (Math.random() - 0.5) * (Math.random() * 20),
              }
            )
          );
        }

        if (ene_el.radius - 10 >= 20) {
          gsap.to(ene_el, {
            radius: ene_el.radius / 2,
          });

          total_score += 10;
          score += +10;
          total_score_text.textContent = total_score;
          score_text.textContent = score;
        } else {
          setTimeout(() => {
            console.log(ene_i, pro_i);

            enemies.splice(ene_i, 1);
            total_score += 20;
            score += +20;
            total_score_text.textContent = total_score;
            score_text.textContent = score;
          }, 0);
        }
        if (!option.includes("power")) {
          setTimeout(() => {
            projectiles.splice(pro_i, 1);
          }, 0);
        }
      }
    });
  });
}

function spawnEnemies() {
  function meteos() {
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
    const color = (ctx.fillStyle =
      "hsl(" + 360 * Math.random() + ", 50%, 50%)");
    let size = Math.random() * 30 + 20;
    if (option.length == 3) size = Math.random() * 35 + 20;
    enemies.push(new Enemy(respawn_x, respawn_y, size, color, { x, y }));
  }

  const data = JSON.parse(localStorage.getItem("option"));
  option = data ? data : [];

  if (option.length == 3 || total_score >= 10000) {
    console.log("max");
    setInterval(() => {
      meteos();
    }, 800);
  }

  if (option.length == 2 || total_score >= 3500) {
    setInterval(() => {
      console.log("speed Up");

      meteos();
    }, 1300);
  }
  if (option.length == 1 || total_score >= 2000) {
    setInterval(() => {
      meteos();
    }, 1500);
  }
  setInterval(() => {
    meteos();
  }, 1800);
}

function init() {
  projectiles = [];
  enemies = [];
  particles = [];
}

addEventListener("click", (e) => {
  const angle = Math.atan2(e.clientY - point_y, e.clientX - point_x);
  const angle1 = Math.atan2(
    e.clientY - point_y - 120,
    e.clientX - point_x - 120
  );
  const angle2 = Math.atan2(
    e.clientY - point_y + 120,
    e.clientX - point_x + 120
  );
  const x = Math.cos(angle);
  const y = Math.sin(angle);
  const x1 = Math.cos(angle1);
  const y1 = Math.sin(angle1);
  const x2 = Math.cos(angle2);
  const y2 = Math.sin(angle2);

  if (start_btn.className === "hidden") {
    if (option.includes("multi")) {
      projectiles.push(
        /* new Projectile(point_x, point_y, 5, "white", {
          x: x,
          y: x * -1,
        }), */
        new Projectile(point_x, point_y, 5, "white", { x, y }),
        new Projectile(point_x, point_y, 5, "white", {
          x: x * -1,
          y: y * -1,
        })
      );
    } else {
      projectiles.push(new Projectile(point_x, point_y, 5, "white", { x, y }));
    }
  }
});

///modal

//upgrade
function hiddenItem() {
  console.log(option);
  if (option) {
    if (option.includes("power")) {
      power.style.visibility = "hidden";
    }
    if (option.includes("speed")) {
      speed.style.visibility = "hidden";
    }
    if (option.includes("multi")) {
      multi.style.visibility = "hidden";
    }
  }
}

addEventListener("load", function (e) {
  total_score = +localStorage.getItem("score");
  total_score_text.textContent = total_score;
  const data = JSON.parse(localStorage.getItem("option"));
  option = data ? data : [];
  if (option.length == 3) {
    const up_alter = document.querySelector(".up_alter");

    up_alter.style.fontSize = "20px";
    up_alter.style.textAlign = "center";
    up_alter.textContent = "모든 업그레이드가 완료되었습니다.";
  }
  hiddenItem();
});

animate();
spawnEnemies();

function alert() {
  a.textContent = "스코어가 부족합니다.";
  a.style.color = "red";
}

power.addEventListener("click", () => {
  if (total_score >= 000) {
    total_score -= 3000;
    total_score_text.textContent = total_score;
    modal_total_score.textContent = total_score;
    option.push("power");
    localStorage.setItem("option", JSON.stringify(option));
    localStorage.setItem("score", total_score);
    hiddenItem();
    a.textContent = "업그레이드 완료.";
    a.style.color = "#0d8593";
  } else {
    alert();
  }
});

power.addEventListener("mouseenter", () => {
  desc.textContent = "미사일이 운석을 뚫고 지나갑니다.";
});

speed.addEventListener("click", () => {
  if (total_score <= 0) {
    total_score -= 2000;
    total_score_text.textContent = total_score;
    modal_total_score.textContent = total_score;
    option.push("speed");
    localStorage.setItem("option", JSON.stringify(option));
    localStorage.setItem("score", total_score);
    hiddenItem();
    a.textContent = "업그레이드 완료.";
    a.style.color = "#0d8593";
  } else {
    alert();
  }
});

speed.addEventListener("mouseenter", () => {
  desc.textContent = "미사일의 발사속도가 빨라집니다.";
});

multi.addEventListener("click", () => {
  if (total_score <= 0) {
    total_score -= 5000;
    total_score_text.textContent = total_score;
    modal_total_score.textContent = total_score;
    option.push("multi");
    localStorage.setItem("option", JSON.stringify(option));
    localStorage.setItem("score", total_score);
    hiddenItem();
    a.textContent = "업그레이드 완료.";
    a.style.color = "#0d8593";
  } else {
    alert();
  }
});

multi.addEventListener("mouseenter", () => {
  desc.textContent = "한번에 미사일이 2개 발사됩니다.";
});

re_start_btn.addEventListener("click", () => {
  modal.style.visibility = "hidden";
  score = 0;
  score_text.textContent = score;
  bgm.play();
  bgm.loop = true;
  init();
  animate();
});
