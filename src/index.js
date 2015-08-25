let _ = require('underscore');
let Biscuit = require('./biscuit');
let Ghost = require('./ghost');
let graphics = require('./graphics');
let Maze = require('./maze');
let Pacman = require('./pacman');
let Pill = require('./pill');
let Vector2D = require('./vector2d');
let functional = require('./functional');

const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const CANVAS_SIZE = graphics.size();
const SCALE = 40;
const GHOST_EATABLE_TIMEOUT = 8000;
const MAZE_MAP = [
    [ 9,  5,  1,  5,  5,  3,  9,  5,  5,  1,  5,  3],
    [10, 15, 10, 13,  7, 10, 10, 13,  7, 10, 15, 10],
    [ 8,  5,  0,  1,  5,  4,  4,  5,  1,  0,  5,  2],
    [12,  5,  2, 12,  5,  3,  9,  5,  6,  8,  5,  6],
    [ 5,  7, 10,  9,  5,  4,  4,  5,  3, 10, 13,  5],
    [ 5,  5,  0,  2, 13,  4,  4,  7,  8,  0,  5,  5],
    [ 5,  7, 10,  8,  5,  5,  5,  5,  2, 10, 13,  5],
    [ 9,  5,  0,  4,  5,  3,  9,  5,  4,  0,  5,  3],
    [12,  3,  8,  1,  5,  4,  4,  5,  1,  2,  9,  6],
    [ 9,  4,  6, 12,  5,  3,  9,  5,  6, 12,  4,  3],
    [12,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  6]
];
const RESOURCE_MAP = [
    [ 0,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    [ 2,  0,  1,  0,  0,  1,  1,  0,  0,  1,  0,  2],
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    [ 0,  0,  1,  0,  0,  0,  0,  0,  0,  1,  0,  0],
    [ 0,  0,  1,  0,  0,  0,  0,  0,  0,  1,  0,  0],
    [ 0,  0,  1,  0,  0,  0,  0,  0,  0,  1,  0,  0],
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    [ 2,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  2],
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1]
];
const ENTITY_SPEED = 1/20;

let score = 0;

let maze = Maze.fromMap(MAZE_MAP);
let pacman = new Pacman('pacman', [0, 0]);
let ghosts = [
    new Ghost('blinky', '#fd0900', [4, 5]),
    new Ghost('pinky',  '#feb8de', [5, 5]),
    new Ghost('inky',   '#22ffde', [6, 5]),
    new Ghost('clyde',  '#feb846', [7, 5])
];
let resources = [];

for (let i = 0; i < RESOURCE_MAP.length; ++i) {
    for (let j = 0; j < RESOURCE_MAP[0].length; ++j) {
        let resource;
        switch (RESOURCE_MAP[i][j]) {
        case 1:
            resource = new Biscuit([j, i]);
            break;
        case 2:
            resource = new Pill([j, i]);
            resource.on('eaten', on_pill_eaten);
            break;
        default:
            break;
        }
        if (resource) {
            resource.on('eaten', on_resource_eaten);
            resources.push(resource);
        }
    }
}

let entities = [maze, ...resources, pacman, ...ghosts];
let move_map = {};

function on_resource_eaten(resource) {
    score += resource.point;
}

function set_ghost_eatable(ghost, eatable) {
    ghost.eatable = eatable;
    ghost.velocity = ghost.velocity.mul(ghost.eatable ? 1/2 : 2);
}

function on_pill_eaten() {
    for (let ghost of ghosts) {
        set_ghost_eatable(ghost, true);
        setTimeout(set_ghost_eatable.bind(null, ghost, false), GHOST_EATABLE_TIMEOUT);
    }
}

function position_to_cell(pos) {
    return  maze.cellAt({
        x: Math.floor(pos.x),
        y: Math.floor(pos.y)
    });
}

function ghost_next_cell(current, origin) {
    let candidates = _.chain(maze.reachableNeighborsOf(current)).shuffle().pluck(1).value();
    if (candidates.length > 1) {
        return _.find(candidates, cell => cell !== origin);
    }
    return _.first(candidates);
}

function move_ghost(ghost) {
    let {orig_cell, dest_cell} = move_map[ghost.name] || {};

    if (!dest_cell) {
        let current_pos = ghost.position;
        let current_cell = position_to_cell(current_pos);
        let speed = ghost.eatable ? ENTITY_SPEED/2 : ENTITY_SPEED;

        dest_cell = ghost_next_cell(current_cell, orig_cell);
        orig_cell = current_cell;

        ghost.velocity = dest_cell.position.sub(current_pos).unit().mul(speed);
        move_map[ghost.name] = {orig_cell, dest_cell};
    }

    if (ghost.distanceFrom(dest_cell.position) > ghost.speed) {
        ghost.step();
    } else {
        ghost.position = dest_cell.position;
        delete move_map[ghost.name].dest_cell;
    }
}

function pacman_next_cell(current_cell, direction) {
    return maze.reachableNeighbor(current_cell, direction)
        || maze.reachableNeighbor(current_cell, pacman.direction);
}

function move_pacman() {
    let {dest_cell, direction = new Vector2D()} = move_map.pacman || {};

    if (!dest_cell) {
        let current_pos = pacman.position;
        let current_cell = position_to_cell(current_pos);

        if ((dest_cell = pacman_next_cell(current_cell, direction))) {
            pacman.velocity = dest_cell.position.sub(current_pos).unit().mul(ENTITY_SPEED);
            move_map.pacman = {dest_cell, direction};
        } else {
            pacman.velocity = new Vector2D();
        }
    }

    if (dest_cell) {
        if (pacman.distanceFrom(dest_cell.position) > .01) {
            pacman.step();
        } else {
            pacman.position = dest_cell.position;
            delete move_map.pacman.dest_cell;
        }
    }
}

let key_to_direction = functional.dispatch(
    ev => ev.keyCode === KEY_LEFT ?  new Vector2D([-1,  0]) : null,
    ev => ev.keyCode === KEY_RIGHT ? new Vector2D([ 1,  0]) : null,
    ev => ev.keyCode === KEY_UP ?    new Vector2D([ 0, -1]) : null,
    ev => ev.keyCode === KEY_DOWN ?  new Vector2D([ 0,  1]) : null
);

function key_down(ev) {
    let direction = key_to_direction(ev);
    if (direction) {
        move_map.pacman = move_map.pacman || {};
        move_map.pacman.direction = direction;
        if (direction.equal(pacman.direction.mul(-1))) {
            delete move_map.pacman.dest_cell;
        }
    }
}

function draw(entity) {
    entity.draw(SCALE);
}

function run() {
    graphics.clear();
    for (let entity of entities) {
        draw(entity);
    }
    for (let ghost of ghosts) {
        move_ghost(ghost);
    }
    let pos = pacman.position;
    for (let resource of resources) {
        if (!resource.eaten && pos.equal(resource.position)) {
            resource.eaten = true;
        }
    }
    move_pacman();
    window.requestAnimationFrame(run);
}

document.addEventListener('keydown', key_down, true);

graphics.translate({
    x: (CANVAS_SIZE.width - SCALE*maze.columns)/2,
    y: (CANVAS_SIZE.height - SCALE*maze.rows)/2
});
window.requestAnimationFrame(run);
