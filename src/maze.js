var _ = require('underscore');
var functional = require('./functional');
var graphics = require('./graphics');

var opposite_direction = functional.dispatch(
    direction => direction === 'north' ? 'south' : undefined,
    direction => direction === 'south' ? 'north' : undefined,
    direction => direction === 'east'  ? 'west'  : undefined,
    direction => direction === 'west'  ? 'east'  : undefined
);

class Cell {
    constructor(row, column, {north = false, east = false, south = false, west = false } = {}) {
        Object.defineProperty(this, 'row', {
            enumerable: true,
            get: function() {
                return row;
            }
        });
        Object.defineProperty(this, 'column', {
            enumerable: true,
            get: function() {
                return column;
            }
        });
        Object.defineProperty(this, 'north', {
            enumerable: true,
            get: function() {
                return north;
            },
            set: function(v) {
                north = v;
            }
        });
        Object.defineProperty(this, 'east', {
            enumerable: true,
            get: function() {
                return east;
            },
            set: function(v) {
                east = v;
            }
        });
        Object.defineProperty(this, 'south', {
            enumerable: true,
            get: function() {
                return south;
            },
            set: function(v) {
                south = v;
            }
        });
        Object.defineProperty(this, 'west', {
            enumerable: true,
            get: function() {
                return west;
            },
            set: function(v) {
                west = v;
            }
        });
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
}

function draw_cell(cell, x, y) {
    var dispatch = {
        north: function() {
            var x1 = 10*cell.column, y1 = 10*cell.row;
            return [x + x1, y + y1, x + x1 + 10, y + y1];
        },
        east: function() {
            var x1 = 10*cell.column + 10, y1 = 10*cell.row;
            return [x + x1, y + y1, x + x1, y + y1 + 10];
        },
        south: function() {
            var x1 = 10*cell.column, y1 = 10*cell.row + 10;
            return [x + x1, y + y1, x + x1 + 10, y + y1];
        },
        west: function() {
            var x1 = 10*cell.column, y1 = 10*cell.row;
            return [x + x1, y + y1, x + x1, y + y1 + 10];
        }
    };
    graphics.setPen(new graphics.Pen(3));
    for (let direction of ['north', 'east', 'south', 'west']) {
        if (!cell[direction]) {
            graphics.drawLine(...dispatch[direction]());
        }
    }
}

function init_random(maze) {
    function init_random_aux(cell) {
        _.chain(maze.neighbors(cell))
            .shuffle()
            .object()
            .each(function(neighbor, direction) {
                if (!neighbor.isOpen()) {
                    cell.open(direction);
                    neighbor.open(opposite_direction(direction));
                    init_random_aux(neighbor);
                }
            });
    }
    init_random_aux(maze.cellAt(0, 0));
    return maze;
}

class Maze {
    constructor(rows, columns) {
        var cells = [];
        for (let row of functional.range(0, rows)) {
            for (let column of functional.range(0, columns)) {
                cells.push(new Cell(row, column));
            }
        }

        Object.defineProperty(this, 'rows', {
            enumerable: true,
            get: function() {
                return rows;
            }
        });
        Object.defineProperty(this, 'columns', {
            enumerable: true,
            get: function() {
                return columns;
            }
        });

        this.cellAt = (i, j) => {
            if (i >= 0 && i < this.rows && j >= 0 && j < this.columns) {
                return cells[i*this.rows + j];
            }
        };
        this.draw = (x, y) => {
            for (let cell of cells) {
                draw_cell(cell, x, y);
            }
        };
    }
    neighbors(cell) {
        return _.filter([
            ['north', this.cellAt(cell.row - 1, cell.column)],
            ['east',  this.cellAt(cell.row, cell.column + 1)],
            ['south', this.cellAt(cell.row + 1, cell.column)],
            ['west',  this.cellAt(cell.row, cell.column - 1)]
        ], function(elt) {
            return functional.existy(elt[1]);
        });
    }
}

exports.create = function(n, m) {
    return init_random(new Maze(n, m));
};
