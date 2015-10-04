import {chain} from 'underscore';
import {existy, range} from './functional';
import * as graphics from './graphics';
import Vector2D from './vector2d';

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
        this.tile = null;
        this.isOpen = () => open;
        this.open = () => {
            open = true;
        };
        this.close = () => {
            open = false;
        };
    }
    get position() {
        return new Vector2D({x: this.column, y: this.row});
    }
    neighborTo(direction) {
        if (direction) {
            const pos = this.position.add(direction);
            let cell = this.maze.cellAt(pos);
            if (!existy(cell) && this.isOpen()) {
                cell = {
                    column: pos.x,
                    row: pos.y,
                    position: pos,
                    neighborTo() {},
                    reachableNeighborTo() {},
                    neighborhood() {},
                    reachableNeighborhood() {},
                    isOpen() { return true; }
                };
            }
            return cell;
        }
    }
    reachableNeighborTo(direction) {
        let neighbor = this.neighborTo(direction);
        if (neighbor && neighbor.isOpen()) {
            return neighbor;
        }
    }
    neighborhood() {
        return chain([Vector2D.NORTH, Vector2D.EAST, Vector2D.SOUTH, Vector2D.WEST])
            .map(direction => this.neighborTo(direction))
            .compact()
            .value();
    }
    reachableNeighborhood() {
        return chain([Vector2D.NORTH, Vector2D.EAST, Vector2D.SOUTH, Vector2D.WEST])
            .map(direction => this.reachableNeighborTo(direction))
            .compact()
            .value();
    }
    draw() {
        if (!this.isOpen() && this.tile) {
            graphics.push();
            graphics.translate(this.position);
            graphics.drawPath(this.tile);
            graphics.pop();
        }
    }
}

export default class Maze {
    constructor(columns, rows) {
        var cells = [];
        for (let row of range(0, rows)) {
            for (let column of range(0, columns)) {
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
        this[Symbol.iterator] = function*() {
            for (let cell of cells) {
                yield cell;
            }
        };
    }
    draw(scale = 1) {
        graphics.push();
        graphics.scale(scale);

        // graphics.setPen({
        //     color: '#999',
        //     width: 1/scale
        // });
        //
        // for (let i = 0; i < this.rows; ++i) {
        //     graphics.drawLine({x: 0, y: i}, {x: this.columns, y: i});
        // }
        //
        // for (let i = 0; i < this.columns; ++i) {
        //     graphics.drawLine({x: i, y: 0}, {x: i, y: this.rows});
        // }

        graphics.setPen({
            color: '#2122ff',
            width: 2/scale
        });
        for (let cell of this) {
            cell.draw();
        }
        graphics.pop();
    }
    static load(data) {
        let maze = new Maze(data.columns, data.rows);
        let tiles = data.tiles.map((path) => new Path2D(path));
        for (let cell of maze) {
            let wall_tile_index = data.topography[cell.row][cell.column];
            if (wall_tile_index != null) {
                cell.close();
                cell.tile = tiles[wall_tile_index];
            } else {
                cell.open();
            }
        }
        return maze;
    }
}
