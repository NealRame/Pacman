const _ = require('underscore');
const existy = require('./functional').existy;
const Entity = require('./entity');
const Vector2D = require('./vector2d');

class MovingEntity extends Entity {
    constructor(pos = new Vector2D(), speed = 0) {
        super(pos);
        /* eslint-disable no-underscore-dangle */
        let _freezed = true;
        let _direction = new Vector2D();
        let _origin = pos;
        let _destination = pos;
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
        Object.defineProperty(this, 'origin', {
            enumerable: true,
            get: () => _origin
        });
        Object.defineProperty(this, 'destination', {
            enumerable: true,
            get: () => _destination,
            set: (destination) => {
                _origin = this.position;
                _destination = destination;
                if (existy(destination)) {
                    this.direction = destination.sub(this.position);
                }
            }
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
    step() {
        if (!this.freezed && existy(this.destination)) {
            const d = this.distanceFrom(this.destination);
            if (d < this.speed) {
                this.position = this.destination;
                this.emit('destination-reached', this);
            } else {
                this.position = this.position.add(this.velocity);
            }
        }
    }
    distanceFrom(p) {
        return this.position.sub(p).norm;
    }
    reset() {
        super.reset();
        this.direction = new Vector2D();
        this.position = this.initialPosition;
        this.destination = this.position;
        this.freezed = true;
    }
}
module.exports = MovingEntity;
