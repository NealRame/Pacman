var Entity = require('./entity');
var Vector2D = require('./vector2d');

class MovingEntity extends Entity {
    constructor(pos = new Vector2D()) {
        super(pos);
        let velocity = new Vector2D();
        let direction = new Vector2D();
        let speed = velocity.norm;
        Object.defineProperty(this, 'velocity', {
            enumerable: true,
            get: () => velocity,
            set: (v) => {
                speed = v.norm;
                velocity = v;
                direction = speed ? velocity.mul(1/speed) : new Vector2D();
            }
        });
        Object.defineProperty(this, 'speed', {
            enumerable: true,
            get: () => speed
        });
        Object.defineProperty(this, 'direction', {
            enumerable: true,
            get: () => direction
        });
    }
    distanceFrom(p) {
        return this.position.sub(p).norm;
    }
    step() {
        this.position = this.position.add(this.velocity);
    }
}
module.exports = MovingEntity;
