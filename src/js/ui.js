import _ from 'underscore';
import * as audio from './audio';
import {canvas} from './graphics';
import {dispatch} from './functional';
import {EventEmitter} from 'events';
import {columns, rows, textZone} from './maze-data.json';
import Vector2D from './vector2d';

export const SCALE = Math.min(canvas.width/columns, canvas.height/rows);
export const TRANSLATE = new Vector2D({
    x: (canvas.width - SCALE*columns)/2,
    y: (canvas.height - SCALE*rows)/2
});

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

const key_to_event = dispatch(
    key_code => key_code === KEY_LEFT ?  ['direction-changed', Vector2D.WEST]  : null,
    key_code => key_code === KEY_RIGHT ? ['direction-changed', Vector2D.EAST]  : null,
    key_code => key_code === KEY_UP ?    ['direction-changed', Vector2D.NORTH] : null,
    key_code => key_code === KEY_DOWN ?  ['direction-changed', Vector2D.SOUTH] : null,
    key_code => key_code === KEY_M ?     ['toggle-sound-mute'] : null,
    key_code => key_code === KEY_P ?     ['toggle-pause'] : null
);

const game_level_field = document.getElementById('level');
const game_lifes_field = document.getElementById('lifes');
const game_high_score_field = document.getElementById('high-score');
const game_score_field = document.getElementById('score');
const game_message_field = document.getElementById('message');
const game_sound_switch = document.getElementById('sound');

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
        audio.events.on('initialized', (err) => {
            if (err) {
                game_sound_switch.setAttribute('muted', true);
            } else {
                game_sound_switch.setAttribute('muted', audio.muted());
            }
        });
        audio.events.on('muted', game_sound_switch.setAttribute.bind(game_sound_switch, 'muted'));
        game_sound_switch.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            audio.toggle();
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
        const rect = canvas.getBoundingClientRect();
        const text_zone_top = textZone.y*SCALE;
        const text_zone_height = textZone.height*SCALE;
        const message_height = game_message_field.getBoundingClientRect().height;

        game_message_field.style.top = rect.top + text_zone_top + (text_zone_height - message_height)/2 + 'px';
        game_message_field.innerHTML = message;
        game_message_field.setAttribute('active', '');
    }
    hideMessage() {
        game_message_field.removeAttribute('active');
    }
}

export default new Ui();
