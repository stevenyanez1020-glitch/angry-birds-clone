// src/GameScene.js
// Phaser 3 scene implementing 3 birds, sling launch and pig death on impact

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.birds = [];
    this.currentBirdIndex = 0;
    this.launched = false;
    this.isDragging = false;
    this.launchThreshold = 0.5;
    this.impactKillSpeed = 6.0; // tweak as needed
    this.slingX = 150;
    this.slingY = 350;
  }

  preload() {
    // Replace these with your asset keys/paths
    this.load.image('bird', 'assets/bird.png');
    this.load.image('pig', 'assets/pig.png');
    this.load.image('pig_dead', 'assets/pig_dead.png');
  }

  create() {
    // Create 3 birds stacked (only first is active on sling)
    for (let i = 0; i < 3; i++) {
      const bird = this.matter.add.image(this.slingX - i * 22, this.slingY + i * 8, 'bird')
        .setCircle()
        .setFrictionAir(0.02)
        .setBounce(0.6);
      bird.isBird = true;
      bird.index = i;
      bird.setStatic(true);
      this.birds.push(bird);
    }

    this.currentBirdIndex = 0;
    this.activeBird = this.birds[this.currentBirdIndex];
    this.placeBirdOnSling(this.activeBird);

    // Create a pig to hit
    this.pigs = [];
    const pig = this.matter.add.image(800, 420, 'pig')
      .setCircle()
      .setBounce(0.2);
    pig.isPig = true;
    pig.hp = 1;
    this.pigs.push(pig);

    // Collision listener
    this.matter.world.on('collisionstart', (event) => {
      event.pairs.forEach(pair => {
        const a = pair.bodyA.gameObject;
        const b = pair.bodyB.gameObject;
        if (!a || !b) return;

        let bird = null, pig = null;
        if (a.isBird && b.isPig) { bird = a; pig = b; }
        else if (b.isBird && a.isPig) { bird = b; pig = a; }
        if (bird && pig) {
          const v = bird.body.velocity;
          const speed = Math.sqrt(v.x * v.x + v.y * v.y);
          if (speed >= this.impactKillSpeed) {
            this.killPig(pig);
          } else {
            const damage = Math.floor(speed);
            pig.hp -= damage;
            if (pig.hp <= 0) this.killPig(pig);
          }
        }
      });
    });

    // Input handling
    this.input.on('pointerdown', (pointer) => {
      if (this.launched) return;
      // Optionally check pointer inside active bird bounds
      this.isDragging = true;
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.isDragging) return;
      const maxDrag = 120;
      const dx = Phaser.Math.Clamp(pointer.x - this.slingX, -maxDrag, maxDrag);
      const dy = Phaser.Math.Clamp(pointer.y - this.slingY, -maxDrag, maxDrag);
      this.activeBird.setPosition(this.slingX + dx, this.slingY + dy);
    });

    this.input.on('pointerup', (pointer) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.launchActiveBird();
    });

    // Optional: camera/world bounds
    this.matter.world.setBounds(0, 0, 2000, 1200);
  }

  placeBirdOnSling(bird) {
    bird.setPosition(this.slingX, this.slingY);
    bird.setStatic(true);
    bird.setAngle(0);
    this.launched = false;
  }

  launchActiveBird() {
    const dx = this.slingX - this.activeBird.x;
    const dy = this.slingY - this.activeBird.y;
    const forceMultiplier = 0.06;
    this.activeBird.setStatic(false);
    this.activeBird.setVelocity(dx * forceMultiplier, dy * forceMultiplier);
    this.launched = true;

    // Poll until bird stops to switch
    const checkEvent = this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        const vel = this.activeBird.body.velocity;
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
        if (speed < this.launchThreshold || this.activeBird.y > 2000 || this.activeBird.x < -500 || this.activeBird.x > 2500) {
          checkEvent.remove();
          this.nextBird();
        }
      }
    });
  }

  nextBird() {
    this.currentBirdIndex++;
    if (this.currentBirdIndex < this.birds.length) {
      this.activeBird = this.birds[this.currentBirdIndex];
      this.placeBirdOnSling(this.activeBird);
    } else {
      this.endTurnNoBirdsLeft();
    }
  }

  killPig(pig) {
    if (pig.dead) return;
    pig.dead = true;
    pig.setTexture('pig_dead');
    try {
      this.matter.world.remove(pig.body);
    } catch (e) {
      // ignore
    }
    if (pig.destroy) pig.destroy();
    this.pigs = this.pigs.filter(p => p !== pig);
    if (this.pigs.length === 0) this.onAllPigsDead();
  }

  onAllPigsDead() {
    console.log('Victory - all pigs dead');
    // implement level complete / UI
  }

  endTurnNoBirdsLeft() {
    console.log('No birds left - end turn');
    // implement retry or game over
  }
}