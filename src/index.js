let _ = require('underscore');
let graphics = require('./graphics');
let Ghost = require('./ghost');
let Maze = require('./maze');
let Pacman = require('./pacman');
let Resource = require('./resource');

const canvas_size = graphics.size();
const scale = 40;
const maze_map = [
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
const resource_map = [
    [ 0,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    [ 1,  0,  1,  0,  0,  1,  1,  0,  0,  1,  0,  1],
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    [ 0,  0,  1,  0,  0,  0,  0,  0,  0,  1,  0,  0],
    [ 0,  0,  1,  0,  0,  0,  0,  0,  0,  1,  0,  0],
    [ 0,  0,  1,  0,  0,  0,  0,  0,  0,  1,  0,  0],
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1]
];

let maze = Maze.fromMap(maze_map);
let pacman = new Pacman('pacman', [0, 0]);
let ghosts = [
    new Ghost('blinky', '#fd0900', [4, 5]),
    new Ghost('pinky',  '#feb8de', [5, 5]),
    new Ghost('inky',   '#22ffde', [6, 5]),
    new Ghost('clyde',  '#feb846', [7, 5])
];
let resources = [];

for (let i = 0; i < resource_map.length; ++i) {
    for (let j = 0; j < resource_map[0].length; ++j) {
        switch (resource_map[i][j]) {
        case 1: resources.push(new Resource([j, i])); break;
        default:
            break;
        }
    }
}

let entities = [maze, ...resources, pacman, ...ghosts];

function draw(entity) {
    entity.draw(scale);
}

let destinations = {};

function destination_cell(current, origin) {
    let candidates = _.chain(maze.reachableNeighborsOf(current)).shuffle().pluck(1).value();
    if (candidates.length > 1) {
        return _.find(candidates, cell => cell !== origin);
    }
    return _.first(candidates);
}

function move_ghost(ghost) {
    let {orig_cell, dest_cell} = destinations[ghost.name];

    if (!dest_cell) {
        let current_pos = ghost.position;
        let current_cell = maze.cellAt(current_pos.x, current_pos.y);

        dest_cell = destination_cell(current_cell, orig_cell);
        orig_cell = current_cell;

        ghost.velocity = dest_cell.position.sub(current_pos).unit().mul(1/50);
        destinations[ghost.name] = {orig_cell, dest_cell};
    }

    if (ghost.distanceFrom(dest_cell.position) > 0.01) {
        ghost.step();
    } else {
        ghost.position = dest_cell.position;
        delete destinations[ghost.name].dest_cell;
    }
}

function run() {
    graphics.clear();
    for (let entity of entities) {
        draw(entity);
    }
    for (let entity of ghosts) {
        move_ghost(entity);
    }
    window.requestAnimationFrame(run);
}

for (let ghost of ghosts) {
    destinations[ghost.name] = {};
}

graphics.translate({
    x: (canvas_size.width - scale*maze.columns)/2,
    y: (canvas_size.height - scale*maze.rows)/2
});
window.requestAnimationFrame(run);
