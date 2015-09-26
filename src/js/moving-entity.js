const _ = require('underscore');
const Entity = require('./entity');
const Vector2D = require('./vector2d');

class MovingEntity extends Entity {
    constructor(pos = new Vector2D(), speed = 0) {
        super(pos);
        /* eslint-disable no-underscore-dangle */
        let _direction = new Vector2D();
        let _freezed = true;
        /* eslint-enable no-underscore-dangle */
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
        Object.defineProperty(this, 'freezed', {
            enumerable: true,
            get: () => _freezed,
            set: (freezed) => {
                _freezed = freezed;
            }
        });
    }
    distanceFrom(p) {
        return this.position.sub(p).norm;
    }
    step() {
        if (!this.freezed) {
            this.position = this.position.add(this.velocity);
        }
    }
    reset() {
        super.reset();
        this.direction = new Vector2D();
        this.position = this.initialPosition;
        this.freezed = true;
    }
}
module.exports = MovingEntity;
