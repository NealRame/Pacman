let _ = require('underscore');
let EventEmitter = require('events').EventEmitter;
let Maze = require('./maze');
let Biscuit = require('./biscuit');
let Ghost = require('./ghost');
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

function create_life_elements(count) {
    return _(count).times(() => {
        let life = document.createElement('span');
        life.className = 'life';
        return life;
    });
}

function create_resources(map, on_pill_eaten, on_resource_eaten) {
    let resources = _(map.length).times((i) => {
        return _(map[i].length).times((j) => {
            let resource;
            switch (map[i][j]) {
                case 1:
                    resource = new Biscuit(new Vector2D([j, i]));
                    break;
                case 2:
                    resource = new Pill(new Vector2D([j, i]));
                    resource.on('eaten', on_pill_eaten);
                    break;
                default:
                    break;
            }
            if (resource) {
                resource.on('eaten', on_resource_eaten);
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
        let _game_over = false;
        let _level = 0;
        let _score = 0;
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

        let game_over = () => {
            if (!_game_over) {
                _game_over = true;
                this.emit('game-over', this);
            }
        };

        let update_score = (points) => {
            _score += points;
            if (_resources.size === 0) {
                game_over();
            }
            this.emit('score-changed', _score);
        };

        let update_life = (lifes) => {
            _lifes = Math.max(_lifes + lifes, 0);
            if (_lifes === 0) {
                game_over();
            }
            this.emit('life-count-changed', _lifes);
        };

        let on_ghost_eaten = (ghost) => {
            _ghost_points_coefficient += 1;
            ghost.eatable = false;
            update_score(_ghost_points_coefficient*ghost.points);
        };

        let on_pill_eaten = () => {
            _ghost_points_coefficient = 0;
            for (let ghost of this.ghosts()) {
                ghost.eatable = true;
            }
        };

        let on_resource_eaten = (resource) => {
            _resources.delete(resource);
            update_score(resource.points);
        };

        _pacman.on('eaten', () => update_life(-1));
        for (let ghost of this.ghosts) {
            ghost.on('eaten', on_ghost_eaten);
        }

        this.levelUp = () => {
            _resources = create_resources(
                RESOURCE_MAP,
                on_pill_eaten,
                on_resource_eaten
            );
            _level += 1;
            this.emit('level-up', _level);
        };

        this.reset = () => {
            for (let entity of [...this.ghosts, _pacman]) {
                entity.reset();
            }
        };
    }
}

module.exports = Game;
