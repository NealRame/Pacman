let _ = require('underscore');

var scheduler = require('./scheduler');
let Game = require('./game');
let audio = require('./audio');
let graphics = require('./graphics');
let ui = require('./ui');

const CANVAS_SIZE = graphics.size();
const SCALE = 16;
const game = new Game('score', 'lifes');

function draw(entity) {
    entity.draw(SCALE);
}

let init_once = _.once(function() {
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

audio.initialize().then((status) => {
    console.log(`audio.initialize: ${status}`);
    graphics.translate({
        x: (CANVAS_SIZE.width - SCALE*game.maze.columns)/2,
        y: (CANVAS_SIZE.height - SCALE*game.maze.rows)/2
    });
    window.requestAnimationFrame(run);
});
