let _ = require('underscore');
let graphics = require('./graphics');
let Ghost = require('./ghost');
let Maze = require('./maze');
let Pacman = require('./pacman');
let Resource = require('./resource');

const scale = 40;
const row = 10;
const column = 10;

let maze = Maze.create(row, column);
let pacman = new Pacman('pacman', [Math.floor(column/2), Math.floor(row/2)]);
let ghosts = [
    new Ghost('blinky', '#fd0900', [0, 0]),
    new Ghost('pinky',  '#feb8de', [0, row - 1]),
    new Ghost('inky',   '#22ffde', [column - 1, 0]),
    new Ghost('clyde',  '#feb846', [column - 1, row - 1])
];
let resources = [];

for (let i = 0; i < row; ++i) {
    for (let j = 0; j < column; ++j) {
        resources.push(new Resource([j, i]));
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

function move(entity) {
    let {orig_cell, dest_cell} = destinations[entity.name];

    if (!dest_cell) {
        let current_pos = entity.position;
        let current_cell = maze.cellAt(current_pos.x, current_pos.y);

        dest_cell = destination_cell(current_cell, orig_cell);
        orig_cell = current_cell;

        entity.velocity = dest_cell.position.sub(current_pos);
        entity.speed = 1/50;
        destinations[entity.name] = {orig_cell, dest_cell};
    }

    if (entity.distanceFrom(dest_cell.position) > 0.01) {
        entity.step();
    } else {
        entity.position = dest_cell.position;
        delete destinations[entity.name].dest_cell;
    }
}

function run() {
    graphics.clear();
    for (let entity of entities) {
        draw(entity);
    }
    for (let entity of ghosts) {
        move(entity);
    }
    window.requestAnimationFrame(run);
}

for (let ghost of ghosts) {
    destinations[ghost.name] = {};
}
graphics.translate({x: (780 - scale*row)/2, y: (520 - scale*column)/2});
window.requestAnimationFrame(run);
