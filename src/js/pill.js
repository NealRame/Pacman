var Entity = require('./entity');
var graphics = require('./graphics');
var Vector2D = require('./vector2d');

let path = new Path2D();
path.arc(.5, .5, .2, 0, 2*Math.PI);

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
