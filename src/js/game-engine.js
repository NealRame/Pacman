import {chain} from 'underscore';
import {dispatch, existy} from './functional';
import Vector2D from './vector2d';

export default class GameEngine {
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

        const position_to_cell_position = (pos) => {
            return new Vector2D({
                x: Math.floor(pos.x),
                y: Math.floor(pos.y)
            });
        };

        const ghost_next_destination = dispatch(
            (ghost, current_cell) => {
                if (current_cell && ghost.eaten && current_cell.row === 11 && current_cell.column === 13) {
                    return current_cell.neighborTo(Vector2D.SOUTH).position;
                }
            },
            (ghost, current_cell) => {
                if (current_cell && ghost.ready && current_cell.row === 13 && current_cell.column === 14) {
                    return current_cell.neighborTo(Vector2D.NORTH).position;
                }
            },
            (ghost, current_cell) => {
                if (current_cell) {
                    const origin = ghost.origin;
                    return chain(current_cell.reachableNeighborhood())
                        .map((cell) => cell.position)
                        .min((pos) => pos.equal(origin) ? Infinity : ghost.target.distance(pos))
                        .value();
                }
            },
            (ghost) => {
                const pos = ghost.position;
                if (pos.x < 0 || pos.x >= maze.columns) {
                    const direction = ghost.direction;
                    if (pos.x <= -2 && direction.equal(Vector2D.WEST)) {
                        ghost.position = new Vector2D({x: maze.columns + 1, y: pos.y});
                    }
                    if (pos.x >= (maze.columns + 1) && direction.equal(Vector2D.EAST)) {
                        ghost.position = new Vector2D({x: -2, y: pos.y});
                    }
                    return ghost.position.add(direction);
                }
            }
        );

        const pacman_next_destination = dispatch(
            // first try to go in the last requested direction
            (current_cell) => {
                if (existy(current_cell)
                    && current_cell.reachableNeighborTo(_next_direction)) {
                    return {
                        current: _next_direction,
                        next: null
                    };
                }
            },
            // otherwise try to keep the same direction.
            (current_cell) => {
                if (existy(current_cell)
                    && current_cell.reachableNeighborTo(pacman.direction)) {
                    return {
                        current: pacman.direction,
                        next: _next_direction
                    };
                }
            },
            // if current cell is null means pacman is currently outside of
            // the maze
            () => {
                const pos = pacman.position;
                if (pos.x < 0 || pos.x >= maze.columns) {
                    let direction = pacman.direction;
                    if (direction.isNull()) {
                        direction = _next_direction;
                        _next_direction = null;
                    }
                    if (pos.x <= -2) {
                        if (direction.equal(Vector2D.WEST)) {
                            pacman.position = new Vector2D({x: maze.columns + 1, y: pos.y});
                        }
                    }
                    if (pos.x >= (maze.columns + 1)) {
                        if (direction.equal(Vector2D.EAST)) {
                            pacman.position = new Vector2D({x: -2, y: pos.y});
                        }
                    }
                    return {
                        current: direction,
                        next: _next_direction
                    };
                }
            }
        );

        const update_entity_destination = (entity) => {
            const current_cell = position_to_cell(entity.position);
            if (entity === pacman) {
                const direction = pacman_next_destination(current_cell);
                if (direction) {
                    _next_direction = direction.next;
                    entity.destination = entity.position.add(direction.current);
                }
            } else {
                entity.destination = ghost_next_destination(entity, current_cell);
            }
        };

        this.updateDirection = (direction) => {
            if (!pacman.eaten) {
                if (direction.add(pacman.direction).isNull()) {
                    pacman.destination = position_to_cell_position(pacman.origin);
                }
                _next_direction = direction;
            }
        };

        this.run = () => {
            pacman.step();
            for (let ghost of ghosts) {
                ghost.step();
            }
        };

        for (let entity of [pacman, ...ghosts]) {
            entity.on('destination-reached', update_entity_destination);
        }
    }
}
