import {existy} from './functional';
import {EventEmitter} from 'events';
import Modernizr from './modernizr';

const SOUND_EXTENSION = Modernizr.audio.ogg ? 'ogg' : 'mp3';
const SOUND_PREFIX = 'assets/sounds/';
const SOUND_FX = [
    'die',
    'eat-dot',
    'eat-fruit',
    'eat-ghost',
    'extra-live',
    'intermission',
    'opening-song',
    'siren'
];

let sound_fx_map;
let sound_fx_load;
let sound_fx_muted = !(Modernizr.webaudio || Modernizr.audio);

export let events = new EventEmitter();
export let trigger;
export let mute;

if (Modernizr.webaudio) {
    const context = new (window.AudioContext || window.webkitAudioContext)();

    const decode_audio_data = function(buffer) {
        return new Promise((resolve, reject) => {
            context.decodeAudioData(buffer, resolve, reject);
        });
    };

    const playing_nodes = new Set();

    sound_fx_load = function([fx, url]) {
        return (new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.responseType = 'arraybuffer';
            req.send();
            req.onload = () => resolve(req.response);
            req.onerror = reject;
        }))
        .then(decode_audio_data)
        .then((audio_buffer) => {
            return [fx, audio_buffer];
        });
    };

    trigger = function(fx) {
        const audio_buffer = sound_fx_map.get(fx);
        if (!sound_fx_muted && existy(audio_buffer)) {
            const source = context.createBufferSource();
            source.buffer = audio_buffer;
            source.connect(context.destination);
            source.start(0);
            source.onended = () => {
                source.onended = null;
                playing_nodes.delete(source);
            };
            playing_nodes.add(source);
        }
    };

    mute = function(flag) {
        if ((sound_fx_muted = flag)) {
            for (let source of playing_nodes) {
                source.stop();
                playing_nodes.delete(source);
            }
        }
        events.emit('muted', sound_fx_muted);
    };
} else if (Modernizr.webaudio) {
    sound_fx_load = function([fx, url]) {
        return new Promise((resolve, reject) => {
            const audio = document.createElement('audio');
            audio.addEventListener('canplaythrough', () => {
                resolve([fx, audio]);
            });
            audio.addEventListener('error', () => {
                reject(new Error(`Fail to load audio fx ${url}`));
            });
            audio.src = url;
        });
    };

    trigger = function(fx) {
        const audio = sound_fx_map.get(fx);
        if (!sound_fx_muted && existy(audio)) {
            audio.pause();
            audio.currentTime = 0;
            audio.play();
        }
    };

    mute = function(flag) {
        if ((sound_fx_muted = flag)) {
            for (let audio of sound_fx_map.values()) {
                audio.pause();
                audio.currentTime = 0;
            }
        }
    };
} else {
    sound_fx_load = function([fx]) {
        return Promise.resolve([fx, null]);
    };
    trigger = () => {};
    mute = () => {};
}

function sound_url(fx) {
    return `${SOUND_PREFIX}/${fx}.${SOUND_EXTENSION}`;
}

export function muted() {
    return sound_fx_muted;
}

export function toggle() {
    mute(!sound_fx_muted);
}

export function initialize() {
    return Promise.all(
        SOUND_FX
            .map((fx) => [fx, sound_url(fx)])
            .map(sound_fx_load)
    )
    .then((res) => {
        sound_fx_map = new Map(res);
        events.emit('initialized');
        return true;
    })
    .catch((err) => {
        console.error(err);
        events.emit('initialized', err);
        return false;
    });
}
