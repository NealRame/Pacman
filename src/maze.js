var _ = require('underscore');
var functional = require('./functional');
var graphics = require('./graphics');

function random_direction() {
    return ['north', 'east', 'south', 'west'][_.random(3)];
}

var opposite_direction = functional.dispatch(
    function(direction) {
        if (direction === 'north') {
            return 'south';
        }
    },
    function(direction) {
        if (direction === 'south') {
            return 'north';
        }
    },
    function(direction) {
        if (direction === 'east') {
            return 'west';
        }
    },
    function(direction) {
        if (direction === 'west') {
            return 'east';
        }
    }
);

function Cell(i, j, walls) {
    if (!(_.isNumber(i) && _.isNumber(j))) {
        throw new Error('row and column are required and must be numbers');
    }
    /* eslint-disable no-underscore-dangle */
    var row_ = i;
    var column_ = j;
    var walls_ = _.defaults(_.clone(walls || {}), {
        north: false,
        east: false,
        south: false,
        west: false
    });
    Object.defineProperty(this, 'row', {
        enumerable: true,
        get: function() {
            return row_;
        }
    });
    Object.defineProperty(this, 'column', {
        enumerable: true,
        get: function() {
            return column_;
        }
    });
    Object.defineProperty(this, 'walls', {
        enumerable: true,
        get: function() {
            return walls_;
        }
    });
    /* eslint-enable no-underscore-dangle */
}

Cell.prototype.isOpen = function () {
    return _.some(_.values(this.walls));
};

Cell.prototype.open = function(direction) {
    this.walls[direction || random_direction()] = true;
};

function draw_cell(cell, x, y) {
    graphics.setPen(new graphics.Pen(3));
    var dispatch = {
        north: function(open) {
            if (!open) {
                var x1 = 10*cell.column, y1 = 10*cell.row;
                return [x + x1, y + y1, x + x1 + 10, y + y1];
            }
        },
        east: function(open) {
            if (!open) {
                var x1 = 10*cell.column + 10, y1 = 10*cell.row;
                return [x + x1, y + y1, x + x1, y + y1 + 10];
            }
        },
        south: function(open) {
            if (!open) {
                var x1 = 10*cell.column, y1 = 10*cell.row + 10;
                return [x + x1, y + y1, x + x1 + 10, y + y1];
            }
        },
        west: function(open) {
            if(!open) {
                var x1 = 10*cell.column, y1 = 10*cell.row;
                return [x + x1, y + y1, x + x1, y + y1 + 10];
            }
        }
    };
    _.each(cell.walls, function(open, direction) {
        var coordinates = dispatch[direction].call(null, open);
        if (coordinates) {
            graphics.drawLine.apply(null, coordinates);
        }
    });
}

function draw_maze_cells(cells, x, y) {
    _.each(cells, _.partial(draw_cell, _, x || 0, y || 0));
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

function Maze(n, m) {
    var cells = [];
    for (var i = 0; i < n; ++i) {
        for (var j = 0; j < m; ++j) {
            cells.push(new Cell(i, j));
        }
    }
    Object.defineProperty(this, 'rows', {
        enumerable: true,
        get: function() {
            return n;
        }
    });
    Object.defineProperty(this, 'columns', {
        enumerable: true,
        get: function() {
            return m;
        }
    });
    this.cellAt = (function(row, column) {
        if (row >= 0 && row < this.rows && column >= 0 && column < this.columns) {
            return cells[row*m + column];
        }
    }).bind(this);
    this.draw = draw_maze_cells.bind(this, cells);
}

Maze.prototype.neighbors = function(cell) {
    return _.filter([
        ['north', this.cellAt(cell.row - 1, cell.column)],
        ['east',  this.cellAt(cell.row, cell.column + 1)],
        ['south', this.cellAt(cell.row + 1, cell.column)],
        ['west',  this.cellAt(cell.row, cell.column - 1)]
    ], function(elt) {
        return functional.existy(elt[1]);
    });
};

exports.create = function(n, m) {
    return init_random(new Maze(n, m));
};
