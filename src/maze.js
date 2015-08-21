var _ = require('underscore');
var functional = require('./functional');
var graphics = require('./graphics');
var Vector2D = require('./vector2d');

var opposite_direction = functional.dispatch(
    direction => direction === 'north' ? 'south' : undefined,
    direction => direction === 'south' ? 'north' : undefined,
    direction => direction === 'east'  ? 'west'  : undefined,
    direction => direction === 'west'  ? 'east'  : undefined
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
        this.cellAt = (column, row) => {
            if (column >= 0 && column < this.columns && row >= 0 && row < this.rows) {
                return cells[row*this.columns + column];
            }
        };
        this.draw = (scale = 1) => {
            graphics.push();
            graphics.scale(scale);
            graphics.setPen({
                width: 1/scale
            });
            for (let cell of cells) {
                draw_cell(cell);
            }
            graphics.pop();
        };
    }
    neighborsOf(cell) {
        return _.filter([
            ['north', this.cellAt(cell.column, cell.row - 1)],
            ['east',  this.cellAt(cell.column + 1, cell.row)],
            ['south', this.cellAt(cell.column, cell.row + 1)],
            ['west',  this.cellAt(cell.column - 1, cell.row)]
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
                        neighbor.open(opposite_direction(direction));
                        random_aux(neighbor);
                    }
                });
        }
        random_aux(maze.cellAt(0, 0));
        return maze;
    }
    }
}

module.exports = Maze;
