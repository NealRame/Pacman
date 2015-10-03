const _ = require('underscore');
const dispatch = require('./functional').dispatch;
const Vector2D = require('./vector2d');

class GameEngine {
    constructor(maze, pacman, ghosts) {
        /* eslint-disable no-underscore-dangle */
        // let _move_map = {};
        let _next_direction;
        /* eslint-enable no-underscore-dangle */

        const position_to_cell = (pos) => {
            return maze.cellAt({
                x: Math.floor(pos.x),
                y: Math.floor(pos.y)
            });
        };

        const ghost_next_destination = (ghost) => {
            const current = position_to_cell(ghost.position);
            const origin = ghost.origin;
            if (ghost.eaten && current.row === 11 && current.column === 13) {
                return current.neighborTo(Vector2D.SOUTH).position;
            }

            if (ghost.ready && current.row === 13 && current.column === 14) {
                return current.neighborTo(Vector2D.NORTH).position;
            }

            return _.chain(current.reachableNeighborhood())
                .map((cell) => cell.position)
                .min((pos) => pos.equal(origin) ? Infinity : ghost.target.distance(pos))
                .value();
        };

        const pacman_next_destination = dispatch(
            // first try to go in the last requested direction
            current_cell => {
                if (current_cell.reachableNeighborTo(_next_direction)) {
                    return {
                        current: _next_direction,
                        next: null
                    };
                }
            },
            // otherwise try to keep the same direction.
            current_cell => {
                if (current_cell.reachableNeighborTo(pacman.direction)) {
                    return {
                        current: pacman.direction,
                        next: _next_direction
                    };
                }
            }
        );

        const update_entity_destination = (entity) => {
            if (entity === pacman) {
                const position = entity.position;
                const direction = pacman_next_destination(position_to_cell(position));
                if (direction) {
                    _next_direction = direction.next;
                    entity.destination = position.add(direction.current);
                }
            } else {
                entity.destination = ghost_next_destination(entity);
            }
        };

        this.updateDirection = (direction) => {
            if (!pacman.eaten) {
                if (direction.add(pacman.direction).isNull()) {
                    pacman.destination = position_to_cell(pacman.position).position.add(direction);
                }
                _next_direction = direction;
            }
        };

        this.run = () => {
            if (!pacman.eaten) {
                pacman.step();
            }
            for (let ghost of ghosts) {
                if (!pacman.eaten) {
                    ghost.step();
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
            entity.on('destination-reached', update_entity_destination);
        }
    }
}

module.exports = GameEngine;
