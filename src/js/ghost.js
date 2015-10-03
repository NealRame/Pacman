const _ = require('underscore');
const scheduler = require('./scheduler');
const graphics = require('./graphics');
const MovingEntity = require('./moving-entity');
const Vector2D = require('./vector2d');

const GHOST_EATABLE_TIMEOUT = 8000;
const GHOST_EATABLE_COLOR_1 = '#0000bb';
const GHOST_EATABLE_COLOR_2 = '#aaa';
const GHOST_BODY = [
    new Path2D(`
        M 0 1
        L 0 0.4375
        C 0 0.21875 0.25 0 0.5 0
        C 0.75 0 1 0.21875 1 0.4375
        L 1 1
        L 0.875 0.875
        L 0.75 1
        L 0.625 0.875
        L 0.5 1
        L 0.375 0.875
        L 0.25 1
        L 0.125 0.875
        L 0 1
    `),
    new Path2D(`
        M 0 1
        L 0 0.4375
        C 0 0.21875 0.25 0 0.5 0
        C 0.75 0 1 0.21875 1 0.4375
        L 1 1
        L 0.875 0.875
        L 0.875 1
        L 0.75 0.875
        L 0.75 1
        L 0.625 0.875
        L 0.625 1
        L 0.5 0.875
        L 0.375 1
        L 0.375 0.875
        L 0.25 1
        L 0.25 0.875
        L 0.125 1
        L 0.125 0.875
        L 0 1
    `)
];
const OUTER_GHOST_EYE = new Path2D(`
    M .142 0
    A .142 .142 0 1 1 .142 -0.0001
`);
const INNER_GHOST_EYE = new Path2D(`
    M .071 0
    A .071 .071 0 1 1 .071 -0.0001
`);

function *ghost_body_path_generator() {
    let i = 0, j = 0;
    for(;; i = (i + 1)%6) {
        if (i === 0) {
            j = (j + 1)%GHOST_BODY.length;
        }
        yield GHOST_BODY[j];
    }
}

class Ghost extends(MovingEntity) {
    constructor(name, color = '#222', pos = new Vector2D(), speed = 0., target) {
        super(pos, speed);
        /* eslint-disable no-underscore-dangle */
        let _color = color;
        let _eatable = false;
        let _task_id = null;
        let _ready = false;
        let _body_path = ghost_body_path_generator();
        /* eslint-enable no-underscore-dangle */
        Object.defineProperty(this, 'name', {
          enumerable: true,
          get: () => name
        });
        Object.defineProperty(this, 'color', {
            enumerable: true,
            get: () => _color
        });
        Object.defineProperty(this, 'points', {
            enumerable: true,
            get: () => 200
        });
        Object.defineProperty(this, 'ready', {
            enumerable: true,
            get: () => _ready,
            set: (ready) => {
                _ready = !!ready;
            }
        });
        Object.defineProperty(this, 'bodyPath', {
            enumerable: true,
            get: () => _body_path.next().value
        });
        Object.defineProperty(this, 'eatable', {
            enumerable: true,
            get: () => !this.eaten && _eatable,
            set: eatable => {
                if (_task_id) {
                    scheduler.cancel(_task_id);
                    _task_id = null;
                }
                if ((_eatable = eatable)) {
                    _color = GHOST_EATABLE_COLOR_1;
                    _task_id = scheduler.begin()
                        .delay(3*GHOST_EATABLE_TIMEOUT/4,  () => _color = GHOST_EATABLE_COLOR_2)
                        .delay(5*GHOST_EATABLE_TIMEOUT/80, () => _color = GHOST_EATABLE_COLOR_1)
                        .delay(5*GHOST_EATABLE_TIMEOUT/80, () => _color = GHOST_EATABLE_COLOR_2)
                        .delay(5*GHOST_EATABLE_TIMEOUT/80, () => _color = GHOST_EATABLE_COLOR_1)
                        .delay(5*GHOST_EATABLE_TIMEOUT/80, () => {
                            _color = color;
                            _eatable = false;
                        })
                        .end();
                } else {
                    _color = color;
                }
            }
        });
        Object.defineProperty(this, 'target', {
            enumerable: true,
            get: () => target.call(this)
        });
        this.on('eaten', () => this.ready = false);
    }
    reset() {
        super.reset();
        this.eatable = this.ready = false;
    }
    step() {
        if (this.eaten && this.position.equal(this.target)) {
            this.eaten = false;
            scheduler.delay(2000, () => this.ready = true);
        }
        super.step();
    }
    _draw(scale) {
        // We could have used the `Vector2D#norm` getter but `MovingEntity`
        // compute this value when their velocity are set.
        // Thus we avoid a standard calculates each turn.
        let eye_direction = this.velocity.mul(1/(15*this.speed));

        graphics.push();
        graphics.translate({x: -.4, y: -.4});
        graphics.scale(1.8);

        graphics.setPen({
            width: 1/scale
        });

        if (!this.eaten) {
            graphics.setBrush({
                color: this.color
            });
            graphics.fillPath(this.bodyPath);
        }

        graphics.translate({x: 9/32, y: 13/32});
        graphics.setBrush({
            color: '#fff'
        });
        graphics.fillPath(OUTER_GHOST_EYE);
        graphics.drawPath(OUTER_GHOST_EYE);
        graphics.setBrush({
            color: '#000'
        });
        graphics.push();
        graphics.translate(eye_direction);
        graphics.fillPath(INNER_GHOST_EYE);
        graphics.pop();

        graphics.translate(new Vector2D({x: 14/32, y: 0}));
        graphics.setBrush({
            color: '#fff'
        });
        graphics.fillPath(OUTER_GHOST_EYE);
        graphics.drawPath(OUTER_GHOST_EYE);
        graphics.setBrush({
            color: '#000'
        });
        graphics.push();
        graphics.translate(eye_direction);
        graphics.fillPath(INNER_GHOST_EYE);
        graphics.pop();

        graphics.pop();
    }
}

module.exports = Ghost;
