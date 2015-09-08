var _ = require('underscore');
var Entity = require('./entity');
var Vector2D = require('./vector2d');

class MovingEntity extends Entity {
    constructor(pos = new Vector2D(), speed = 0) {
        super(pos);
        let _direction = new Vector2D(); // eslint-disable-line no-underscore-dangle
        Object.defineProperty(this, 'direction', {
            enumerable: true,
            get: () => _direction,
            set: (direction) => _direction = direction.unit()
        });
        Object.defineProperty(this, 'initialPosition', {
            enumerable: true,
            get: () => pos
        });
        Object.defineProperty(this, 'speed', {
            enumerable: true,
            get: _.isFunction(speed) ? speed.bind(this) : _.constant(speed)
        });
        Object.defineProperty(this, 'velocity', {
            enumerable: true,
            get: () => {
                return _direction.mul(this.speed);
            }
        });
    }
    distanceFrom(p) {
        return this.position.sub(p).norm;
    }
    step() {
        this.position = this.position.add(this.velocity);
    }
    reset() {
        super.reset();
        this.direction = new Vector2D();
        this.position = this.initialPosition;
    }
}
module.exports = MovingEntity;
