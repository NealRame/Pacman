var _ = require('underscore');
var functional = require('./functional');
var graphics = require('./graphics');
var Vector2D = require('./vector2d');

let vector_to_cardinal_direction = functional.dispatch(
    v => v.x === 0 && v.y < 0 ? 'north' : null,
    v => v.x === 0 && v.y > 0 ? 'south' : null,
    v => v.y === 0 && v.x < 0 ?  'west' : null,
    v => v.y === 0 && v.x > 0 ?  'east' : null
);
let opposed_cardinal_direction = functional.dispatch(
    direction => direction === 'north' ? 'south' : null,
    direction => direction === 'south' ? 'north' : null,
    direction => direction === 'east'  ? 'west'  : null,
    direction => direction === 'west'  ? 'east'  : null
);

class Cell {
    constructor(column, row, {north = false, east = false, south = false, west = false } = {}) {
        Object.defineProperty(this, 'column', {
            enumerable: true,
            get: () => column
        });
        Object.defineProperty(this, 'row', {
            enumerable: true,
            get: () => row
        });
        this.north = north;
        this.east  = east;
        this.south = south;
        this.west  = west;
    }
    isOpen() {
        return this.north || this.east || this.south || this.west;
    }
    open(direction) {
        this[direction] = true;
    }
    close(direction) {
        this[direction] = false;
    }
    get position() {
        return new Vector2D([this.column, this.row]);
    }
}

function draw_cell(cell) {
    var dispatch = {
        north: function() {
            let p = cell.position;
            return [p, p.add({x: 1, y: 0})];
        },
        east: function() {
            let p = cell.position.add({x: 1, y: 0});
            return [p, p.add({x: 0, y: 1})];
        },
        south: function() {
            let p = cell.position.add({x: 0, y: 1});
            return [p, p.add({x: 1, y: 0})];
        },
        west: function() {
            let p = cell.position;
            return [p, p.add({x: 0, y: 1})];
        }
    };
    for (let direction of ['north', 'east', 'south', 'west']) {
        if (!cell[direction]) {
            graphics.drawLine(...dispatch[direction]());
        }
    }
}

class Maze {
    constructor(columns, rows) {
        var cells = [];
        for (let row of functional.range(0, rows)) {
            for (let column of functional.range(0, columns)) {
                cells.push(new Cell(column, row));
            }
        }
        Object.defineProperty(this, 'columns', {
            enumerable: true,
            get: () => columns
        });
        Object.defineProperty(this, 'rows', {
            enumerable: true,
            get: () => rows
        });
        this.cellAt = ({x: column, y: row}) => {
            if (column >= 0 && column < this.columns && row >= 0 && row < this.rows) {
                return cells[row*this.columns + column];
            }
        };
        this.draw = (scale = 1) => {
            graphics.push();
            graphics.scale(scale);
            graphics.setPen({
                color: '#2122ff',
                width: 2/scale
            });
            for (let cell of cells) {
                draw_cell(cell);
            }
            graphics.pop();
        };
        this[Symbol.iterator] = function*() {
            for (let cell of cells) {
                yield cell;
            }
        };
    }
    neighbor(cell, direction) {
        if (direction) {
            return this.cellAt(cell.position.add(direction));
        }
    }
    reachableNeighbor(cell, direction) {
        if (direction) {
            let cardinal_direction = vector_to_cardinal_direction(direction);
            if (cardinal_direction && cell[cardinal_direction]) {
                return this.neighbor(cell, direction);
            }
        }
    }
    neighborsOf(cell) {
        return _.filter([
            ['north', this.cellAt(cell.position.add(Vector2D.NORTH))],
            ['east',  this.cellAt(cell.position.add(Vector2D.EAST))],
            ['south', this.cellAt(cell.position.add(Vector2D.SOUTH))],
            ['west',  this.cellAt(cell.position.add(Vector2D.WEST))]
        ], elt => functional.existy(elt[1]));
    }
    reachableNeighborsOf(cell) {
        return _.filter(this.neighborsOf(cell), elt => cell[elt[0]]);
    }
    static random(columns, rows) {
        let maze = new Maze(columns, rows);
        function random_aux(cell) {
            _.chain(maze.neighborsOf(cell))
                .shuffle()
                .object()
                .each(function(neighbor, direction) {
                    if (!neighbor.isOpen()) {
                        cell.open(direction);
                        neighbor.open(opposed_cardinal_direction(direction));
                        random_aux(neighbor);
                    }
                });
        }
        random_aux(maze.cellAt(0, 0));
        return maze;
    }
    static fromMap(map) {
        let maze = new Maze(map[0].length, map.length);
        for (let cell of maze) {
            let flag = map[cell.row][cell.column];
            cell.north = (flag & 0x01) === 0;
            cell.east  = (flag & 0x02) === 0;
            cell.south = (flag & 0x04) === 0;
            cell.west  = (flag & 0x08) === 0;
        }
        return maze;
    }
}

module.exports = Maze;
