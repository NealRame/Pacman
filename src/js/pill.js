const Entity = require('./entity');
const graphics = require('./graphics');
const Vector2D = require('./vector2d');

const path = new Path2D(`
    M .2 .5
    A .4 .4 0 1 1 .2 .5001
`);

class Pill extends Entity {
    constructor(pos = new Vector2D()) {
        super(pos);
        Object.defineProperty(this, 'points', {
            enumerable: true,
            get: () => 50
        });
    }
    _draw() {
        if (!this.eaten) {
            graphics.push();
            graphics.setBrush({
                color: '#dfa299'
            });
            graphics.fillPath(path);
            graphics.pop();
        }
    }
}
module.exports = Pill;
