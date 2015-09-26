let _ = require('underscore');

var scheduler = require('./scheduler');
let Game = require('./game');
let audio = require('./audio');
let graphics = require('./graphics');
let ui = require('./ui');
let Vector2D = require('./vector2d');

const CANVAS_SIZE = graphics.size();
const SCALE = 16;
const game = new Game('score', 'lifes');
const pacman = game.pacman;
const ghosts = game.ghosts;

let move_map = {};

function position_to_cell(pos) {
    return  game.maze.cellAt({
        x: Math.floor(pos.x),
        y: Math.floor(pos.y)
    });
}

function ghost_candidate_cells(ghost, current, origin) {
    if (ghost.eaten) {
        let pos = current.position;
        if (pos.equal({x: 5, y: 4}) || pos.equal({x: 6, y: 4})) {
            return [game.maze.cellAt(pos.add(Vector2D.SOUTH))];
        }
    }
    let cells = current.reachableNeighborhood();
    return cells.length > 1 ? _.omit(cells, cell => cell === origin) : cells;
}

function ghost_next_cell(ghost, current, origin) {
    let candidates = ghost_candidate_cells(ghost, current, origin);
    let next_cell;
    if (candidates.length === 1) {
        next_cell = _.first(candidates);
    } else {
        next_cell = ghost.eatable
            ? _.chain(candidates).shuffle().first().value()
            : _.min(candidates, (cell) => {
                if (cell === origin) {
                    return Infinity;
                }
                return ghost.target.distance(cell.position);
            });
    }
    return {orig_cell: current, next_cell};
}

function move_ghost(ghost) {
    let {orig_cell, next_cell} = move_map[ghost.name];
    if (!next_cell) {
        let current_pos = ghost.position;

        move_map[ghost.name] = ghost_next_cell(ghost, position_to_cell(current_pos), orig_cell);
        next_cell = move_map[ghost.name].next_cell;
        ghost.direction = next_cell.position.sub(current_pos).unit();
    }
    if (ghost.distanceFrom(next_cell.position) > ghost.speed) {
        ghost.step();
    } else {
        ghost.position = next_cell.position;
        delete move_map[ghost.name].next_cell;
    }
}

function pacman_next_cell() {
    if (move_map.pacman.next_cell) {
        return move_map.pacman.next_cell;
    }

    let direction = move_map.pacman.direction;
    let current_pos = pacman.position;
    let current_cell = position_to_cell(current_pos);

    // first try to go in the last requested direction, if direction is not
    // permitted try to continue in the same direction.
    // let cell = game.maze.reachableNeighbor(current_cell, direction);
    let cell = current_cell.reachableNeighborTo(direction);
    if (!cell) {
        cell = current_cell.reachableNeighborTo(pacman.direction);
        if (!cell) {
            pacman.direction = new Vector2D();
        }
    } else {
        pacman.direction = direction;
        delete move_map.pacman.direction;
    }

    move_map.pacman.next_cell = cell;

    return cell;
}

function move_pacman() {
    let cell = pacman_next_cell(move_map.pacman.direction);
    if (cell) {
        if (pacman.distanceFrom(cell.position) > pacman.speed) {
            pacman.step();
        } else {
            pacman.position = cell.position;
            delete move_map.pacman.next_cell;
        }
    }
}

function on_direction_changed(direction) {
    if (!pacman.eaten) {
        move_map.pacman = move_map.pacman || {};
        if (direction.add(pacman.direction).isNull()) {
            delete move_map.pacman.next_cell;
        }
        move_map.pacman.direction = direction;
    }
}

function on_toggle_sound_mute() {
    audio.toggle();
}

function on_entity_reset(entity) {
    move_map[entity.name] = {};
}

function draw(entity) {
    entity.draw(SCALE);
}

let init_once = _.once(function() {
    for (let entity of [pacman, ...ghosts]) {
        entity.on('reset', on_entity_reset);
    }
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
    ui.on('direction-changed', on_direction_changed);
    ui.on('toggle-sound-mute', on_toggle_sound_mute);
});

function run(timestamp) {
    let pos = pacman.position;

    scheduler.update(timestamp);
    init_once();
    graphics.clear();
    draw(game.maze);
    for (let resource of game.resources) {
        if (!resource.eaten && pos.equal(resource.position)) {
            resource.eaten = true;
        } else {
            draw(resource);
        }
    }
    for (let ghost of ghosts) {
        if (!pacman.eaten) {
            move_ghost(ghost);
        }
        if (pacman.distanceFrom(ghost.position) < .5) {
            if (ghost.eatable) {
                ghost.eaten = true;
            } else if (!(ghost.eaten || pacman.eaten)) {
                pacman.eaten = true;
            }
        }
        draw(ghost);
    }
    move_pacman();
    draw(pacman);
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
