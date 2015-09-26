const _ = require('underscore');
const Vector2D = require('./vector2d');

class GameEngine {
    constructor(maze, pacman, ghosts) {
        /* eslint-disable no-underscore-dangle */
        let _move_map = {};
        /* eslint-enable no-underscore-dangle */

        const position_to_cell = (pos) => {
            return maze.cellAt({
                x: Math.floor(pos.x),
                y: Math.floor(pos.y)
            });
        };

        const ghost_candidate_cells = (ghost, current, origin) => {
            if (ghost.eaten) {
                let pos = current.position;
                if (pos.equal({x: 5, y: 4}) || pos.equal({x: 6, y: 4})) {
                    return current.neighborTo(Vector2D.SOUTH);
                }
            }
            let cells = current.reachableNeighborhood();
            return cells.length > 1 ? _.omit(cells, cell => cell === origin) : cells;
        };

        const ghost_next_cell = (ghost, current, origin) => {
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
        };

        const move_ghost = (ghost) => {
            let {orig_cell, next_cell} = _move_map[ghost.name];
            if (!next_cell) {
                let current_pos = ghost.position;

                _move_map[ghost.name] = ghost_next_cell(ghost, position_to_cell(current_pos), orig_cell);
                next_cell = _move_map[ghost.name].next_cell;
                ghost.direction = next_cell.position.sub(current_pos).unit();
            }
            if (ghost.distanceFrom(next_cell.position) > ghost.speed) {
                ghost.step();
            } else {
                ghost.position = next_cell.position;
                delete _move_map[ghost.name].next_cell;
            }
        };

        const pacman_next_cell = () => {
            if (_move_map.pacman.next_cell) {
                return _move_map.pacman.next_cell;
            }

            let direction = _move_map.pacman.direction;
            let current_pos = pacman.position;
            let current_cell = position_to_cell(current_pos);

            // first try to go in the last requested direction, if direction is not
            // permitted try to continue in the same direction.
            // let cell = game.maze.reachableNeighbor(current_cell, direction);
            let cell = current_cell.reachableNeighborTo(direction);
            if (!cell) {
                cell = current_cell.reachableNeighborTo(pacman.direction);
                if (!cell) {
                    pacman.direction = new Vector2D();
                }
            } else {
                pacman.direction = direction;
                delete _move_map.pacman.direction;
            }

            _move_map.pacman.next_cell = cell;

            return cell;
        };

        const move_pacman = () => {
            let cell = pacman_next_cell(_move_map.pacman.direction);
            if (cell) {
                if (pacman.distanceFrom(cell.position) > pacman.speed) {
                    pacman.step();
                } else {
                    pacman.position = cell.position;
                    delete _move_map.pacman.next_cell;
                }
            }
        };

        const reset_entity = (entity) => {
            _move_map[entity.name] = {};
        };

        this.updateDirection = (direction) => {
            if (!pacman.eaten) {
                _move_map.pacman = _move_map.pacman || {};
                if (direction.add(pacman.direction).isNull()) {
                    delete _move_map.pacman.next_cell;
                }
                _move_map.pacman.direction = direction;
            }
        };

        this.run = () => {
            move_pacman();
            for (let ghost of ghosts) {
                if (!pacman.eaten) {
                    move_ghost(ghost);
                }
                if (pacman.distanceFrom(ghost.position) < .5) {
                    if (ghost.eatable) {
                        ghost.eaten = true;
                    } else if (!(ghost.eaten || pacman.eaten)) {
                        pacman.eaten = true;
                    }
                }
            }
        };

        for (let entity of [pacman, ...ghosts]) {
            entity.on('reset', reset_entity);
        }
    }
}

module.exports = GameEngine;
