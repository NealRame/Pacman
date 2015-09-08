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
const ENTITY_SPEED = 1/20;

let game_score = 0;

function *resource_generator(map) {
    for (let i = 0; i < map.length; ++i) {
        for (let j = 0; j < map[i].length; ++j) {
            let resource;
            switch (RESOURCE_MAP[i][j]) {
                case 1:
                    resource = new Biscuit(new Vector2D([j, i]));
                    break;
                case 2:
                    resource = new Pill(new Vector2D([j, i]));
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

let maze = Maze.fromMap(MAZE_MAP);

let ghost_points_coefficient = 0;
let pacman = new Pacman('pacman', new Vector2D([0, 0]), ENTITY_SPEED);

function ghost_speed() {
    if (this.eaten) {
        return ENTITY_SPEED*2;
    } else if (this.eatable) {
        return ENTITY_SPEED/2;
    }
    return ENTITY_SPEED;
}

let blinky = new Ghost(
    'blinky',
    '#fd0900',
    new Vector2D([4, 5]), ghost_speed, {
    chasing: () => pacman.position,
    scattering: new Vector2D([maze.columns - 2, -1])
});

let pinky = new Ghost(
    'pinky',
    '#feb8de',
    new Vector2D([5, 5]), ghost_speed, {
    chasing: () => {
        let u = pacman.velocity.unit().mul(4);
        if (u.equal({x: 0, y: 0})) {
            u = new Vector2D([4, 0]);
        }
        return pacman.position.add(u);
    },
    scattering: new Vector2D([1, -1])
});

let inky = new Ghost(
    'inky',
    '#22ffde',
    new Vector2D([6, 5]), ghost_speed, {
    chasing: () => {
        let u = pacman.velocity.unit().mul(2);
        if (u.equal({x: 0, y: 0})) {
            u = new Vector2D([2, 0]);
        }
        let p = Vector2D.fromPoint(blinky.position, pacman.position.add(u));
        return u.add(p);
    },
    scattering: new Vector2D([maze.columns - 1, maze.rows])
});

let clyde = new Ghost(
    'clyde',
    '#feb846',
    new Vector2D([7, 5]), ghost_speed, {
    chasing: () => {
        let d = pacman.distanceFrom(clyde.position);
        return d > 8 ? pacman.position : new Vector2D([0, maze.rows]);
    },
    scattering: new Vector2D([0, maze.rows])
});

const GHOST_MAP = [blinky, pinky, inky, clyde];

function *ghost_generator(map) {
    for (let ghost of map) {
        ghost.on('eaten', on_ghost_eaten);
        yield ghost;
    }
}

let [...ghosts] = ghost_generator(GHOST_MAP);
let [...resources] = resource_generator(RESOURCE_MAP);
let entities = [maze, ...resources, pacman, ...ghosts];
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

function on_ghost_eaten(ghost) {
    ghost_points_coefficient += 1;
    ghost.eatable = false;
    game_score += ghost_points_coefficient*ghost.points;
}

function on_resource_eaten(resource) {
    game_score += resource.points;
}

function on_pill_eaten() {
    ghost_points_coefficient = 0;
    for (let ghost of ghosts) {
        ghost.eatable = true;
    }
}

function position_to_cell(pos) {
    return  maze.cellAt({
        x: Math.floor(pos.x),
        y: Math.floor(pos.y)
    });
}

function ghost_candidate_cells(ghost, current, origin) {
    if (ghost.eaten) {
        let pos = current.position;
        if (pos.equal({x: 5, y: 4}) || pos.equal({x: 6, y: 4})) {
            return [maze.cellAt(pos.add(Vector2D.SOUTH))];
        }
    }
    let cells = _.chain(maze.reachableNeighborsOf(current)).pluck(1).value();
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
    let {orig_cell, next_cell} = move_map[ghost.name] || {};

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
    let cell = maze.reachableNeighbor(current_cell, direction);
    if (!cell) {
        cell = maze.reachableNeighbor(current_cell, pacman.direction);
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
    move_map.pacman = move_map.pacman || {};
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

function draw(entity) {
    entity.draw(SCALE);
}

let init_game_mode = _.once(function() {
    document.addEventListener('keydown', key_down, true);
    graphics.translate({
        x: (CANVAS_SIZE.width - SCALE*maze.columns)/2,
        y: (CANVAS_SIZE.height - SCALE*maze.rows)/2
    });
    enter_scatter_mode();
});

function run(timestamp) {
    scheduler.update(timestamp);
    init_game_mode();
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
window.requestAnimationFrame(run);
