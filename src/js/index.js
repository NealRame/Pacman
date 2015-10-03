import * as graphics from './graphics';
import * as scheduler from './scheduler';
import {once} from 'underscore' ;
import audio from './audio';
import ui, {SCALE, TRANSLATE} from './ui';
import Game from './game';

const CANVAS_SIZE = graphics.size();
const SCALE = 16;
const game = new Game();

const init_once = once(function() {
    game.on('score-changed', function(score) {
        ui.score = score;
    });
    game.on('high-score-changed', function(score) {
        ui.highScore = score;
    });
    game.on('level-up', function(level) {
        ui.level = level;
    });
    game.on('life-count-changed', function(life_count) {
        ui.lifes = life_count;
    });
    game.on('game-over', function() {
        if (game.lifes < 0) {
            game.reset();
        } else {
            game.levelUp();
        }
    });
    game.on('game-started', function() {
        ui.hideMessage();
    });
    game.on('reset', function() {
        ui.highScore = game.highScore;
        ui.level = game.level;
        ui.lifes = game.lifes;
        ui.score = game.score;
        ui.showMessage('Ready');
    });
    game.reset();
    ui.on('direction-changed', (direction) => {
        game.engine.updateDirection(direction);
    });
    ui.on('toggle-pause', () => {
        game.togglePause();
    });
    ui.on('toggle-sound-mute', () => {
        audio.toggle();
    });
});

function draw(entity) {
    entity.draw(SCALE);
}

function run(timestamp) {
    scheduler.update(timestamp);
    init_once();
    game.run();
    graphics.clear();
    draw(game.maze);
    if (!game.paused) {
        for (let drawable of [...game.resources, ...game.ghosts, game.pacman]) {
            draw(drawable);
        }
    }
    window.requestAnimationFrame(run);
}

audio.initialize().then(() => {
        graphics.translate(TRANSLATE);
        window.requestAnimationFrame(run);
    });
    window.requestAnimationFrame(run);
});
