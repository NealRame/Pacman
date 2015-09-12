let _ = require('underscore');
var scheduler = require('./scheduler');
let Biscuit = require('./biscuit');
let EventEmitter = require('events').EventEmitter;
let Ghost = require('./ghost');
let Maze = require('./maze');
let Pacman = require('./pacman');
let Pill = require('./pill');
let Vector2D = require('./vector2d');

const MAZE_MAP = [
    [ 9,  5,  1,  5,  5,  3,  9,  5,  5,  1,  5,  3],
    [10, 15, 10, 13,  7, 10, 10, 13,  7, 10, 15, 10],
    [ 8,  5,  0,  1,  5,  4,  4,  5,  1,  0,  5,  2],
    [12,  5,  2, 12,  5,  3,  9,  5,  6,  8,  5,  6],
    [ 5,  7, 10,  9,  5,  4,  4,  5,  3, 10, 13,  5],
    [ 5,  5,  0,  2, 13,  4,  4,  7,  8,  0,  5,  5],
    [ 5,  7, 10,  8,  5,  5,  5,  5,  2, 10, 13,  5],
    [ 9,  5,  0,  4,  5,  3,  9,  5,  4,  0,  5,  3],
    [12,  3,  8,  1,  5,  4,  4,  5,  1,  2,  9,  6],
    [ 9,  4,  6, 12,  5,  3,  9,  5,  6, 12,  4,  3],
    [12,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  6]
];
const RESOURCE_MAP = [
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    [ 2,  0,  1,  0,  0,  1,  1,  0,  0,  1,  0,  2],
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    [ 0,  0,  1,  0,  0,  0,  0,  0,  0,  1,  0,  0],
    [ 0,  0,  1,  0,  0,  0,  0,  0,  0,  1,  0,  0],
    [ 0,  0,  1,  0,  0,  0,  0,  0,  0,  1,  0,  0],
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    [ 2,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  2],
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1]
];
const ENTITY_SPEED = 1/20;

function create_resources(map, on_resource_eaten) {
    let resources = _(map.length).times((i) => {
        return _(map[i].length).times((j) => {
            let resource;
            switch (map[i][j]) {
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
        let _maze = Maze.fromMap(MAZE_MAP);
        let _game_over = true;
        let _high_score = 0;
        let _score = 0;
        let _level = 1;
        let _lifes = 2;
        let _ghost_points_coefficient = 0;
        let _resources;
        let _pacman = new Pacman('pacman', new Vector2D([5, 6]), function() {
            return this.eaten ?  0 : ENTITY_SPEED;
        });
        let _blinky = new Ghost(
            'blinky',
            '#fd0900',
            new Vector2D([4, 5]), ghost_speed, {
            chasing: () => _pacman.position,
            scattering: new Vector2D([_maze.columns - 2, -1])
        });
        let _pinky = new Ghost(
            'pinky',
            '#feb8de',
            new Vector2D([5, 5]), ghost_speed, {
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
            new Vector2D([6, 5]), ghost_speed, {
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
            new Vector2D([7, 5]), ghost_speed, {
            chasing: () => {
                let d = _pacman.distanceFrom(_clyde.position);
                return d > 8 ? _pacman.position : new Vector2D([0, _maze.rows]);
            },
            scattering: new Vector2D([0, _maze.rows])
        });
        /* eslint-enable-line no-underscore-dangle */

        Object.defineProperty(this, 'maze', {
            enumerable: true,
            get: () => _maze
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

        let game_over = () => {
            if (!_game_over) {
                _game_over = true;
                this.emit('game-over');
            }
        };

        let update_score = (points) => {
            _score += points;
            this.emit('score-changed', _score);
            if (_score > _high_score) {
                _high_score = _score;
                this.emit('high-score-changed', _high_score);
            }
        };

        let update_life = (lifes) => {
            _lifes += lifes;
            this.emit('life-count-changed', _lifes);
        };

        let on_ghost_eaten = (ghost) => {
            _ghost_points_coefficient += 1;
            ghost.eatable = false;
            update_score(_ghost_points_coefficient*ghost.points);
        };

        let on_pacman_eaten = () => {
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

        let on_resource_eaten = (resource) => {
            _resources.delete(resource);
            update_score(resource.points);
            if (resource instanceof Pill) {
                _ghost_points_coefficient = 0;
                for (let ghost of this.ghosts) {
                    ghost.eatable = true;
                }
            }
            if (_resources.size === 0) {
                for (let entity of [_pacman, ...this.ghosts]) {
                    entity.freezed = true;
                }
                game_over();
            }
        };

        this.levelUp = () => {
            _resources = create_resources(
                RESOURCE_MAP,
                on_resource_eaten
            );
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
                _resources = create_resources(
                    RESOURCE_MAP,
                    on_resource_eaten
                );
            }
            scheduler.cancelAll();
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
}

module.exports = Game;
