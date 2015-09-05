let _ = require('underscore');
let Biscuit = require('./biscuit');
var scheduler = require('./scheduler');
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
const GHOST_MAP = [
    ['blinky', '#fd0900', [4, 5]],
    ['pinky',  '#feb8de', [5, 5]],
    ['inky',   '#22ffde', [6, 5]],
    ['clyde',  '#feb846', [7, 5]]
];
const ENTITY_SPEED = 1/20;

function *resource_generator(map) {
    for (let i = 0; i < map.length; ++i) {
        for (let j = 0; j < map[i].length; ++j) {
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
                yield resource;
            }
        }
    }
}

function *ghost_generator(map) {
    for (let data of map) {
        let ghost = new Ghost(...data);
        ghost.on('eaten', on_ghost_eaten);
        yield ghost;
    }
}

let game_score = 0;
let ghost_points_coefficient = 0;
let maze = Maze.fromMap(MAZE_MAP);
let pacman = new Pacman('pacman', [0, 0]);
let [...ghosts] = ghost_generator(GHOST_MAP);
let [...resources] = resource_generator(RESOURCE_MAP);
let entities = [maze, ...resources, pacman, ...ghosts];
let move_map = {};

function on_ghost_eaten(ghost) {
    ghost_points_coefficient += 1;
    game_score += ghost_points_coefficient*ghost.points;
    // console.log(ghost.name, game_score);

    let current_pos = ghost.position;
    let dest_cell = maze.cellAt({x: 4, y: 5});

    ghost.eatable = false;
    ghost.velocity = dest_cell.position.sub(current_pos).unit().mul(ENTITY_SPEED*2);
    move_map[ghost.name] = {dest_cell};
}

function on_resource_eaten(resource) {
    game_score += resource.points;
    // console.log('score', game_score);
}

function on_pill_eaten() {
    ghost_points_coefficient = 0;
    for (let ghost of ghosts) {
        ghost.eatable = true;
        ghost.velocity = ghost.velocity.mul(ghost.eatable ? 1/2 : 2);
    }
}

function position_to_cell(pos) {
    return  maze.cellAt({
        x: Math.floor(pos.x),
        y: Math.floor(pos.y)
    });
}

function ghost_next_cell(ghost, current, origin) {
    let next_cell;
    let candidates = _.chain(maze.reachableNeighborsOf(current)).shuffle().pluck(1).value();
    if (candidates.length > 1) {
        next_cell = _.find(candidates, cell => cell !== origin);
    } else {
        next_cell = _.first(candidates);
    }
    return next_cell;
}

function move_ghost(ghost) {
    let {orig_cell, dest_cell} = move_map[ghost.name] || {};

    if (!dest_cell) {
        let current_pos = ghost.position;
        let current_cell = position_to_cell(current_pos);
        let speed = ghost.eatable ? ENTITY_SPEED/2 : ENTITY_SPEED;

        dest_cell = ghost_next_cell(ghost, current_cell, orig_cell);
        orig_cell = current_cell;

        ghost.eaten = false;
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
        if (pacman.distanceFrom(dest_cell.position) > pacman.speed) {
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
        ev.preventDefault();
        ev.stopPropagation();
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

function run(timestamp) {
    scheduler.update(timestamp);

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
    for (let ghost of ghosts) {
        if (pacman.distanceFrom(ghost.position) < .5) {
            if (ghost.eatable) {
                ghost.eaten = true;
            } else {
                pacman.eaten = true;
                // TODO PACMAN IS DEAD!
            }
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
