var _ = require('underscore');
var scheduler = require('./scheduler');
var graphics = require('./graphics');
var MovingEntity = require('./moving-entity');
var Vector2D = require('./vector2d');

const GHOST_EATABLE_TIMEOUT = 8000;
const GHOST_EATABLE_COLOR_1 = '#0000bb';
const GHOST_EATABLE_COLOR_2 = '#aaa';
const GHOST_BODY = new Path2D(`
    M 0 1
    V .3333
    C 0 .0833, .3333 0, .5 0
    S 1 .0833, 1 .3333
    V 1
    L .8333 .7777
    L .6666 1
    L .5 .7777
    L .3333 1
    L .1666 .7777
    L 0 1
`);
const OUTER_GHOST_EYE = new Path2D(`
    M .142 0
    A .142 .142 0 1 1 .142 -0.0001
`);
const INNER_GHOST_EYE = new Path2D(`
    M .071 0
    A .071 .071 0 1 1 .071 -0.0001
`);

class Ghost extends(MovingEntity) {
    constructor(name, color = '#222', pos = new Vector2D(), speed = 0., behavior = {}) {
        super(pos, speed);
        let _color = color;   // eslint-disable-line no-underscore-dangle
        let _eatable = false; // eslint-disable-line no-underscore-dangle
        let _task_id = null;  // eslint-disable-line no-underscore-dangle
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
            get: () => {
                if (this.eaten) {
                    return pos;
                }
                return _.result(behavior, this.state || 'chasing', pos);
            }
        });
        this.step = () => {
            if (this.position.equal(pos)) {
                this.eaten = false;
            }
            super.step();
        };
    }
    _draw(scale) {
        // We could have used the `Vector2D#norm` getter but `MovingEntity`
        // compute this value when their velocity are set.
        // Thus we avoid a standard calculates each turn.
        let eye_direction = this.velocity.mul(1/(15*this.speed));

        graphics.push();
        graphics.translate({x: .1, y: .1});
        graphics.scale(0.8);

        graphics.setPen({
            width: 1/scale
        });

        if (!this.eaten) {
            graphics.setBrush({
                color: this.color
            });
            graphics.fillPath(GHOST_BODY);
            graphics.drawPath(GHOST_BODY);
        }

        graphics.translate(new Vector2D([9/32, 13/32]));
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

        graphics.translate(new Vector2D([14/32, 0]));
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
