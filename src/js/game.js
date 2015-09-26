const _ = require('underscore');
const audio = require('./audio');
const Biscuit = require('./biscuit');
const Engine = require('./game-engine');
const EventEmitter = require('events').EventEmitter;
const Ghost = require('./ghost');
const Maze = require('./maze');
const Pacman = require('./pacman');
const Pill = require('./pill');
const scheduler = require('./scheduler');
const Vector2D = require('./vector2d');

const MAZE_DATA = require('./maze-data.json');
const ENTITY_SPEED = 1/10;

function init_resources(on_resource_eaten) {
    let resources = _(MAZE_DATA.rows).times((i) => {
        return _(MAZE_DATA.columns).times((j) => {
            let resource;
            switch (MAZE_DATA.resources[i][j]) {
                case 1:
                    resource = new Biscuit(new Vector2D([j, i]));
                    break;
                case 2:
                    resource = new Pill(new Vector2D([j, i]));
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

function ghost_speed() {
    if (this.eaten) {
        return ENTITY_SPEED*2;
    } else if (this.eatable) {
        return ENTITY_SPEED/2;
    }
    return ENTITY_SPEED;
}

class Game extends EventEmitter {
    constructor() {
        super();
        /* eslint-disable no-underscore-dangle */
        let _maze = Maze.load(MAZE_DATA);
        let _game_over = true;
        let _paused = false;
        let _high_score = 0;
        let _score = 0;
        let _level = 1;
        let _lifes = 2;
        let _ghost_points_coefficient = 0;
        let _resources;
        let _pacman = new Pacman('pacman', new Vector2D([13, 23]), function() {
            return this.eaten ?  0 : ENTITY_SPEED;
        });
        let _blinky = new Ghost(
            'blinky',
            '#fd0900',
            new Vector2D([13, 11]), ghost_speed, {
            chasing: () => _pacman.position,
            scattering: new Vector2D([_maze.columns - 2, -1])
        });
        let _pinky = new Ghost(
            'pinky',
            '#feb8de',
            new Vector2D([11, 13]), ghost_speed, {
            chasing: () => {
                let u = _pacman.velocity.unit().mul(4);
                if (u.equal({x: 0, y: 0})) {
                    u = new Vector2D([4, 0]);
                }
                return _pacman.position.add(u);
            },
            scattering: new Vector2D([1, -1])
        });
        let _inky = new Ghost(
            'inky',
            '#22ffde',
            new Vector2D([13, 13]), ghost_speed, {
            chasing: () => {
                let u = _pacman.velocity.unit().mul(2);
                if (u.equal({x: 0, y: 0})) {
                    u = new Vector2D([2, 0]);
                }
                let p = Vector2D.fromPoint(_blinky.position, _pacman.position.add(u));
                return u.add(p);
            },
            scattering: new Vector2D([_maze.columns - 1, _maze.rows])
        });
        let _clyde = new Ghost(
            'clyde',
            '#feb846',
            new Vector2D([15, 13]), ghost_speed, {
            chasing: () => {
                let d = _pacman.distanceFrom(_clyde.position);
                return d > 8 ? _pacman.position : new Vector2D([0, _maze.rows]);
            },
            scattering: new Vector2D([0, _maze.rows])
        });
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
            for (let ghost of this.ghosts) {
                ghost.state = 'scattering';
            }
            scheduler.delay(7000, enter_chase_mode);
        };

        enter_chase_mode = () => {
            for (let ghost of this.ghosts) {
                ghost.state = 'chasing';
            }
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
            this.engine.run();
            const pos = this.pacman.position;
            for (let resource of this.resources) {
                if (pos.equal(resource.position)) {
                    resource.eaten = true;
                }
            }
        }
    }
    togglePause() {
        this.paused = !this.paused;
    }
}

module.exports = Game;
