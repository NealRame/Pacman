const _ = require('underscore');
const functional = require('./functional');
const EventEmitter = require('events').EventEmitter;
const Vector2D = require('./vector2d');

const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_M = 77;
const KEY_P = 80;

function create_life_elements(count) {
    return _(Math.max(count, 0)).times(() => {
        let life = document.createElement('span');
        life.className = 'life';
        return life;
    });
}

const key_to_event = functional.dispatch(
    key_code => key_code === KEY_LEFT ?  ['direction-changed', Vector2D.WEST]  : null,
    key_code => key_code === KEY_RIGHT ? ['direction-changed', Vector2D.EAST]  : null,
    key_code => key_code === KEY_UP ?    ['direction-changed', Vector2D.NORTH] : null,
    key_code => key_code === KEY_DOWN ?  ['direction-changed', Vector2D.SOUTH] : null,
    key_code => key_code === KEY_M ?     ['toggle-sound-mute'] : null,
    key_code => key_code === KEY_P ?     ['toggle-pause'] : null
);

const game_screen = require('./graphics').canvas;
const game_level_field = document.getElementById('level');
const game_lifes_field = document.getElementById('lifes');
const game_high_score_field = document.getElementById('high-score');
const game_score_field = document.getElementById('score');
const game_message_field = document.getElementById('message');

class Ui extends EventEmitter {
    constructor() {
        super();
        document.addEventListener('keydown', (ev) => {
            const event_data = key_to_event(ev.keyCode);
            if (event_data) {
                this.emit(...event_data);
                ev.preventDefault();
                ev.stopPropagation();
            }
        });
    }
    set lifes(life_count) {
        game_lifes_field.innerHTML = '';
        for (let life of create_life_elements(life_count)) {
            game_lifes_field.appendChild(life);
        }
    }
    set level(level) {
        game_level_field.innerHTML = `${level}`;
    }
    set highScore(high_score) {
        game_high_score_field.innerHTML = `${high_score}`;
    }
    set score(score) {
        game_score_field.innerHTML = `${score}`;
    }
    showMessage(message) {
        let rect = game_screen.getBoundingClientRect();
        console.log(rect);
        game_message_field.style.top = (rect.top) + 'px';
        game_message_field.innerHTML = message;
        game_message_field.setAttribute('active', '');
    }
    hideMessage() {
        game_message_field.removeAttribute('active');
    }
}

module.exports = new Ui();
