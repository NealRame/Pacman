import *  as audio from './audio';
import * as graphics from './graphics';
import * as scheduler from './scheduler';
import {once} from 'underscore' ;
import ui, {SCALE, TRANSLATE} from './ui';
import Game from './game';

function document_ready() {
    if (document.readyState === 'complete') {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        document.onreadystatechange = () => {
            if (document.readyState === 'complete') {
                resolve();
            }
        };
    });
}

function init_game(game) {
    game.on('score-changed', score => ui.score = score);
    game.on('high-score-changed', score => ui.highScore = score);
    game.on('level-up', level => ui.level = level);
    game.on('life-count-changed', life_count => ui.lifes = life_count);
    game.on('game-over', () => {
        if (game.lifes < 0) {
            game.reset();
        } else {
            game.levelUp();
        }
    });
    game.on('game-started', () => ui.hideMessage());
    game.on('reset', () => {
        ui.highScore = game.highScore;
        ui.level = game.level;
        ui.lifes = game.lifes;
        ui.score = game.score;
        ui.showMessage('Ready');
    });
    ui.on('direction-changed', direction => game.engine.updateDirection(direction));
    ui.on('toggle-pause', () => game.togglePause());
    ui.on('toggle-sound-mute', () => audio.toggle());
    game.reset();
}

function draw(entity) {
    entity.draw(SCALE);
}

document_ready()
    .then(audio.initialize)
    .then(() => {
        const game = new Game();
        const init = once(init_game);

        function run(timestamp) {
            scheduler.update(timestamp);
            init(game);
            game.run();
            graphics.clear();
            graphics.push();
            graphics.translate(TRANSLATE);
            draw(game.maze);
            if (!game.paused) {
                for (let drawable of [...game.resources, ...game.ghosts, game.pacman]) {
                    draw(drawable);
                }
            }
            graphics.pop();
            window.requestAnimationFrame(run);
        }
        window.requestAnimationFrame(run);
    });
