import _ from 'underscore';
import * as audio from './audio';
import * as scheduler from './scheduler';
import {dispatch} from './functional';
import {EventEmitter} from 'events';
import Biscuit from './biscuit';
import Engine from './game-engine';
import Ghost from './ghost';
import Maze from './maze';
import Pacman from './pacman';
import Pill from './pill';
import Vector2D from './vector2d';
import MAZE_DATA from './maze-data.json';

const ENTITY_SPEED = 1/10;
const GAME_MODE_SCATTERING = 0;
const GAME_MODE_CHASING = 1;

function init_resources(on_resource_eaten) {
    let resources = _(MAZE_DATA.rows).times((y) => {
        return _(MAZE_DATA.columns).times((x) => {
            let resource;
            switch (MAZE_DATA.resources[y][x]) {
                case 1:
                    resource = new Biscuit(new Vector2D({x, y}));
                    break;
                case 2:
                    resource = new Pill(new Vector2D({x, y}));
                    break;
                default:
                    break;
            }
            if (resource) {
                resource.once('eaten', on_resource_eaten);
            }
            return resource;
        });
    });
    return new Set(_.compact(_(resources).flatten()));
}

function random_position() {
    return new Vector2D({
        x: _.random(MAZE_DATA.columns),
        y: _.random(MAZE_DATA.rows)
    });
}

function ghost_speed() {
    if (this.eaten) {
        return ENTITY_SPEED*2;
    } else if (this.eatable) {
        return ENTITY_SPEED/2;
    }
    return ENTITY_SPEED;
}

function is_in_ghost_house(ghost) {
    const pos = ghost.position;
    const ghost_house = MAZE_DATA.ghostHouseZone;
    return ghost_house.x <= pos.x && pos.x < (ghost_house.x + ghost_house.width)
        && ghost_house.y <= pos.y && pos.y < (ghost_house.y + ghost_house.height);
}

const common_ghost_behavior = dispatch(
    (ghost) => {
        if (!ghost.ready) {
            return new Vector2D({x: 13, y: 14});
        }
    },
    (ghost) => {
        if (ghost.eatable) {
            return random_position();
        }
    },
    (ghost) => {
        if (ghost.ready && is_in_ghost_house(ghost)) {
            return new Vector2D(MAZE_DATA.engagementZone);
        }
    },
    (ghost, mode) => {
        if (mode === GAME_MODE_SCATTERING) {
            return new Vector2D(MAZE_DATA.scatteringZones[ghost.name]);
        }
    }
);

export default class Game extends EventEmitter {
    constructor() {
        super();
        /* eslint-disable no-underscore-dangle */
        let _game_over = true;
        let _paused = false;
        let _mode = GAME_MODE_SCATTERING;
        let _high_score = 0;
        let _score = 0;
        let _level = 1;
        let _lifes = 2;
        let _ghost_points_coefficient = 0;
        let _resources;
        const _maze = Maze.load(MAZE_DATA);
        const _pacman = new Pacman(
            'pacman',
            new Vector2D(MAZE_DATA.respawnZones.pacman),
            ENTITY_SPEED
        );
        const _blinky = new Ghost(
            'blinky',
            '#fd0900',
            new Vector2D(MAZE_DATA.respawnZones.blinky),
            ghost_speed,
            dispatch(
                () => common_ghost_behavior(_blinky, _mode),
                () => _pacman.position
            )
        );
        const _pinky = new Ghost(
            'pinky',
            '#feb8de',
            new Vector2D(MAZE_DATA.respawnZones.pinky),
            ghost_speed,
            dispatch(
                () => common_ghost_behavior(_pinky, _mode),
                () => {
                    let u = _pacman.velocity.unit().mul(4);
                    if (u.equal({x: 0, y: 0})) {
                        u = new Vector2D([4, 0]);
                    }
                    return _pacman.position.add(u);
                }
            )
        );
        const _inky = new Ghost(
            'inky',
            '#22ffde',
            new Vector2D(MAZE_DATA.respawnZones.inky),
            ghost_speed,
            dispatch(
                () => common_ghost_behavior(_inky, _mode),
                () => {
                    let u = _pacman.velocity.unit().mul(2);
                    if (u.equal({x: 0, y: 0})) {
                        u = new Vector2D([2, 0]);
                    }
                    let p = Vector2D.fromPoint(_blinky.position, _pacman.position.add(u));
                    return u.add(p);
                }
            )
        );
        const _clyde = new Ghost(
            'clyde',
            '#feb846',
            new Vector2D(MAZE_DATA.respawnZones.clyde),
            ghost_speed,
            dispatch(
                () => common_ghost_behavior(_clyde, _mode),
                () => _pacman.distanceFrom(_clyde.position) > 8
                        ? _pacman.position
                        : new Vector2D([0, _maze.rows])
            )
        );
        const _engine = new Engine(_maze, _pacman, [_blinky, _pinky, _inky, _clyde]);
        /* eslint-enable-line no-underscore-dangle */

        Object.defineProperty(this, 'maze', {
            enumerable: true,
            get: () => _maze
        });

        Object.defineProperty(this, 'paused', {
            enumerable: true,
            get: () => _paused,
            set: (paused) => {
                _paused = !!paused;
            }
        });

        Object.defineProperty(this, 'resources', {
            enumerable: true,
            get: () => _resources
        });

        Object.defineProperty(this, 'pacman', {
            enumerable: true,
            get: () => _pacman
        });

        Object.defineProperty(this, 'ghosts', {
            enumerable: true,
            get: () => [_blinky, _pinky, _inky, _clyde]
        });

        Object.defineProperty(this, 'lifes', {
            enumerable: true,
            get: () => _lifes
        });

        Object.defineProperty(this, 'score', {
            enumerable: true,
            get: () => _score
        });

        Object.defineProperty(this, 'highScore', {
            enumerable: true,
            get: () => _high_score
        });

        Object.defineProperty(this, 'level', {
            enumerable: true,
            get: () => _level
        });

        Object.defineProperty(this, 'engine', {
            enumerable: true,
            get: () => _engine
        });

        const game_over = () => {
            if (!_game_over) {
                _game_over = true;
                this.emit('game-over');
            }
        };

        const game_start = () => {
            for (let entity of [...this.ghosts, _pacman]) {
                entity.freezed = false;
            }
            scheduler.delay(0, () => _blinky.ready = true);
            scheduler.delay(1000, () => {
                _pinky.ready = true;
                _inky.ready = true;
            });
            scheduler.delay(3000, () => _clyde.ready = true);
            this.emit('game-started');
        };

        const update_score = (points) => {
            _score += points;
            this.emit('score-changed', _score);
            if (_score > _high_score) {
                _high_score = _score;
                this.emit('high-score-changed', _high_score);
            }
        };

        const update_life = (lifes) => {
            _lifes += lifes;
            this.emit('life-count-changed', _lifes);
        };

        const on_ghost_eaten = (ghost) => {
            _ghost_points_coefficient += 1;
            ghost.eatable = false;
            update_score(_ghost_points_coefficient*ghost.points);
        };

        const on_pacman_eaten = () => {
            for (let entity of [_pacman, ...this.ghosts]) {
                entity.freezed = true;
            }
            update_life(-1);
            scheduler.delay(2000, () => {
                if (_lifes < 0) {
                    game_over();
                } else {
                    this.reset();
                }
            });
        };

        const on_resource_eaten = (resource) => {
            _resources.delete(resource);
            update_score(resource.points);
            if (resource instanceof Pill) {
                audio.trigger('eat-fruit');
                _ghost_points_coefficient = 0;
                for (let ghost of this.ghosts) {
                    ghost.eatable = true;
                }
            } else {
                audio.trigger('eat-dot');
            }
            if (_resources.size === 0) {
                for (let entity of [_pacman, ...this.ghosts]) {
                    entity.freezed = true;
                }
                scheduler.delay(2000, () => {
                    game_over();
                });
            }
        };

        this.levelUp = () => {
            _resources = init_resources(on_resource_eaten);
            _level += 1;
            this.reset();
            this.emit('level-up', _level);
        };

        let enter_chase_mode;
        let enter_scatter_mode;

        enter_scatter_mode = () => {
            _mode = GAME_MODE_SCATTERING;
            scheduler.delay(7000, enter_chase_mode);
        };

        enter_chase_mode = () => {
            _mode = GAME_MODE_CHASING;
            scheduler.delay(20000, enter_scatter_mode);
        };

        this.reset = () => {
            if (_game_over) {
                _game_over = false;
                if (_lifes < 0) {
                    _score = 0;
                    _level = 1;
                    _lifes = 2;
                }
                _resources = init_resources(on_resource_eaten);
            }
            scheduler.cancelAll();
            audio.trigger('opening-song');
            scheduler.delay(4000, game_start);
            for (let entity of [...this.ghosts, _pacman]) {
                entity.reset();
                if (entity !== _pacman) {
                    entity.destination = entity.position.add({x: .5, y: 0});
                    entity.position = entity.destination;
                }
            }
            enter_scatter_mode();
            this.emit('reset');
        };

        for (let entity of [_pacman, ...this.ghosts]) {
            entity.on('eaten', entity === _pacman
                ? on_pacman_eaten
                : on_ghost_eaten
            );
        }
    }
    run() {
        if (!this.paused) {
            if (!this.pacman.eaten) {
                this.engine.run();
            }
            // who eats whom ?
            const pos = this.pacman.position;
            // resources
            for (let resource of this.resources) {
                if (pos.equal(resource.position)) {
                    resource.eaten = true;
                }
            }
            // ghosts
            for (let ghost of this.ghosts) {
                if (pos.distance(ghost.position) < .1) {
                    if (ghost.eatable) {
                        ghost.eaten = true;
                        audio.trigger('eat-ghost');
                    } else if (!(ghost.eaten || this.pacman.eaten)) {
                        this.pacman.eaten = true;
                        audio.trigger('die');
                    }
                }
            }
        }
    }
    togglePause() {
        this.paused = !this.paused;
    }
}
