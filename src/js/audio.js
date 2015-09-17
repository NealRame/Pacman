require('browsernizr/test/audio');

let _ = require('underscore');
let Modernizr = require('browsernizr');

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
        let _fx_map; // eslint-disable-line no-underscore-dangle

        this.trigger = (fx) => {
            let audio = _fx_map.get(fx);
            if (audio) {
                console.log(`will trigger ${fx}`);
                audio.pause();
                audio.currentTime = 0;
                audio.play();
            }
        };

        this.initialize = () => {
            return Promise.all(_.map(SOUND_FX, load_audio_fx))
                .then(res => {
                    _fx_map = new Map(res);
                    return true;
                })
                .catch(( ) => false);
        };
    }
}

module.exports = new AudioFX();
