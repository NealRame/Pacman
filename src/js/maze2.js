var _ = require('underscore');
var functional = require('./functional');
var graphics = require('./graphics');
var Vector2D = require('./vector2d');

class Cell {
    constructor(column, row, maze, open = false) {
        Object.defineProperty(this, 'column', {
            enumerable: true,
            get: () => column
        });
        Object.defineProperty(this, 'row', {
            enumerable: true,
            get: () => row
        });
        Object.defineProperty(this, 'maze', {
            enumerable: true,
            get: () => maze
        });
        this.isOpen = () => open;
        this.open = () => {
            open = true;
        };
        this.close = () => {
            open = false;
        };
    }
    get position() {
        return new Vector2D([this.column, this.row]);
    }
    neighborTo(direction) {
        if (direction) {
            return this.maze.cellAt(this.position.add(direction));
        }
    }
    reachableNeighborTo(direction) {
        let neighbor = this.neighborTo(direction);
        if (neighbor && neighbor.isOpen()) {
            return neighbor;
        }
    }
    neighborhood() {
        return _.chain([Vector2D.NORTH, Vector2D.EAST, Vector2D.SOUTH, Vector2D.WEST])
            .map(direction => this.neighborTo(direction))
            .compact()
            .value();
    }
    reachableNeighborhood() {
        return _.chain([Vector2D.NORTH, Vector2D.EAST, Vector2D.SOUTH, Vector2D.WEST])
            .map(direction => this.reachableNeighborTo(direction))
            .compact()
            .value();
    }
}
const MAP = `
----------------------------
1555555555555215555555555552
6000
601
606
601
600
601
603
600
355
000
000
000
555
000
555
000
000
000
155
600
601
603
600
352
154
600
601
603
600
3555555555555555555555555554
`;
const WALL_TILES = [
    new Path2D('M 0.5 1 L 0.5 0'),
    new Path2D('M 0 0.5 L 1 0.5'),
    new Path2D('M 0 0.5 L 0.5 0.5 L 0.5 0 M 0.5 0.5 L 1 0.5'),
    new Path2D('M 0 0.5 L 0.5 0.5 L 0.5 1 M 0.5 0.5 L 1 0.5'),
    new Path2D('M 0.5 0 C 0.5 0.28125 0.71875 0.5 1 0.5'),
    new Path2D('M 0 0.5 C 0.28125 0.5 0.5 0.28125 0.5 0'),
    new Path2D('M 0.5 1 C 0.5 0.71875 0.28125 0.5 0 0.5'),
    new Path2D('M 0.5 1 C 0.5 0.71875 0.71875 0.5 1 0.5'),
    new Path2D('M 0.5 0 L 0.5 0.5 L 0 0.5 M 0.5 0.5 L 0.5 1'),
    new Path2D('M 0.5 0 L 0.5 0.5 L 1 0.5 M 0.5 0.5 L 0.5 1'),
    new Path2D('M 0.5 1 L 0.5 0 M 0 0.5 L 1 0.5')
];

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
                cells.push(new Cell(column, row, this));
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
    static fromMap(map) {
        let maze = new Maze(map[0].length, map.length);
        for (let cell of maze) {
            if(map[cell.row][cell.column] === 0) {
                cell.open();
            }
        }
        return maze;
    }
}

module.exports = Maze;
