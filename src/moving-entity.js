var Entity = require('./entity');
var Vector2D = require('./vector2d');

class MovingEntity extends Entity {
    constructor([x = 0, y = 0] = []) {
        super([x, y]);
        let velocity = new Vector2D();
        Object.defineProperty(this, 'velocity', {
            enumerable: true,
            get: () => velocity,
            set: (v) => velocity = v
        });
        Object.defineProperty(this, 'speed', {
            enumerable: true,
            get: () => velocity.norm,
            set: (s) => {
                velocity = velocity.mul(1/velocity.norm*s);
            }
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
