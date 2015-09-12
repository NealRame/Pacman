let _ = require('underscore');

var scheduler = require('./scheduler');
let Game = require('./game');
let functional = require('./functional');
let graphics = require('./graphics');
let Vector2D = require('./vector2d');

const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const CANVAS_SIZE = graphics.size();
const SCALE = 40;

const game = new Game('score', 'lifes');
const pacman = game.pacman;
const ghosts = game.ghosts;

let move_map = {};

let enter_chase_mode;
let enter_scatter_mode;

enter_scatter_mode = function () {
    for (let ghost of ghosts) {
        ghost.state = 'scattering';
    }
    scheduler.delay(7000, enter_chase_mode);
};

enter_chase_mode = function () {
    for (let ghost of ghosts) {
        ghost.state = 'chasing';
    }
    scheduler.delay(20000, enter_scatter_mode);
};

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
    let cells = _.chain(game.maze.reachableNeighborsOf(current)).pluck(1).value();
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
    let cell = game.maze.reachableNeighbor(current_cell, direction);
    if (!cell) {
        cell = game.maze.reachableNeighbor(current_cell, pacman.direction);
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

let key_to_direction = functional.dispatch(
    ev => ev.keyCode === KEY_LEFT ?  Vector2D.WEST  : null,
    ev => ev.keyCode === KEY_RIGHT ? Vector2D.EAST  : null,
    ev => ev.keyCode === KEY_UP ?    Vector2D.NORTH : null,
    ev => ev.keyCode === KEY_DOWN ?  Vector2D.SOUTH : null
);

function key_down(ev) {
    let direction = key_to_direction(ev);
    if (direction) {
        move_map.pacman = move_map.pacman || {};
        if (direction.add(pacman.direction).isNull()) {
            delete move_map.pacman.next_cell;
        }
        move_map.pacman.direction = direction;
        ev.preventDefault();
        ev.stopPropagation();
    }
}

function reset() {
    scheduler.cancelAll();
    game.reset();
    for (let entity of [pacman, ...ghosts]) {
        move_map[entity.name] = {};
    }
    enter_scatter_mode();
    document.addEventListener('keydown', key_down, true);
}

function on_entity_reset(entity) {
    move_map[entity.name] = {};
}

function on_pacman_eaten() {
    document.removeEventListener('keydown', key_down);
    scheduler.delay(2000, reset);
}

function draw(entity) {
    entity.draw(SCALE);
}

let init_once = _.once(function() {
    game.levelUp();
    for (let entity of [pacman, ...ghosts]) {
        entity.on('reset', on_entity_reset);
        if (entity === pacman) {
            entity.on('eaten', on_pacman_eaten);
        }
    }
    reset();
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

graphics.translate({
    x: (CANVAS_SIZE.width - SCALE*game.maze.columns)/2,
    y: (CANVAS_SIZE.height - SCALE*game.maze.rows)/2
});
window.requestAnimationFrame(run);
