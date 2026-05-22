import { GAME_WIDTH, GAME_HEIGHT } from './data/config.js';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game',
  backgroundColor: '#0a0a14',
  scene: [BootScene, GameScene, UIScene],
  render: { pixelArt: false, antialias: true },
};

new Phaser.Game(config);
