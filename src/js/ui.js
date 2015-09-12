let _ = require('underscore');
let functional = require('./functional');
let EventEmitter = require('events').EventEmitter;
let Vector2D = require('./vector2d');

const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;

function create_life_elements(count) {
    return _(count).times(() => {
        let life = document.createElement('span');
        life.className = 'life';
        return life;
    });
}

let key_to_direction = functional.dispatch(
    ev => ev.keyCode === KEY_LEFT ?  Vector2D.WEST  : null,
    ev => ev.keyCode === KEY_RIGHT ? Vector2D.EAST  : null,
    ev => ev.keyCode === KEY_UP ?    Vector2D.NORTH : null,
    ev => ev.keyCode === KEY_DOWN ?  Vector2D.SOUTH : null
);

let game_score_field = document.getElementById('score');
let game_lifes_field = document.getElementById('lifes');

class Ui extends EventEmitter {
    constructor() {
        super();
        document.addEventListener('keydown', (ev) => {
            let direction = key_to_direction(ev);
            if (direction) {
                this.emit('direction-changed', direction);
                ev.preventDefault();
                ev.stopPropagation();
            }
        });
    }
    set score(score) {
        game_score_field.innerHTML = `${score}`;
    }
    set lifes(life_count) {
        game_lifes_field.innerHTML = '';
        for (let life of create_life_elements(life_count)) {
            game_lifes_field.appendChild(life);
        }
    }
}

module.exports = new Ui();