import 'browsernizr/test/audio';
import Modernizr from 'browsernizr';
import {existy} from './functional';

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

function load_audio_fx(fx) {
    return new Promise(function(resolve, reject) {
        let audio = document.createElement('audio');
        let uri = `${SOUND_PREFIX}/${fx}.${SOUND_EXTENSION}`;
        audio.addEventListener('canplaythrough', () => {
            resolve([fx, audio]);
        });
        audio.addEventListener('error', () => {
            reject(new Error(`Fail to load audio fx ${uri}`));
        });
        audio.src = uri;
    });
}

class AudioFX {
    constructor() {
        /* eslint-disable no-underscore-dangle */
        let _fx_map;
        let _muted = false;
        /* eslint-enable no-underscore-dangle */

        Object.defineProperty(this, 'muted', {
            enumerable: true,
            get: () => _muted,
            set: (muted) => {
                if ((_muted = muted)) {
                    for (let audio of _fx_map.values()) {
                        audio.pause();
                        audio.currentTime = 0;
                    }
                }
            }
        });

        this.trigger = (fx) => {
            const audio = _fx_map.get(fx);
            if (!_muted && existy(audio)) {
                audio.pause();
                audio.currentTime = 0;
                audio.play();
            }
        };

        this.initialize = () => {
            return Promise.all(SOUND_FX.map(load_audio_fx))
                .then(res => {
                    _fx_map = new Map(res);
                    return true;
                })
                .catch(( ) => false);
        };
    }
    toggle() {
        this.muted = !this.muted;
    }
}

export default new AudioFX();
