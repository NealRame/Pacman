var Entity = require('./entity');
var graphics = require('./graphics');

let path = new Path2D();
path.arc(.5, .5, .2, 0, 2*Math.PI);

class Pill extends Entity {
    constructor([x = 0, y = 0] = []) {
        super([x, y]);
        Object.defineProperty(this, 'points', {
            enumerable: true,
            get: () => 50
        });
    }
    _draw() {
        graphics.push();
        graphics.setBrush({
            color: '#000'
        });
        graphics.fillPath(path);
        graphics.pop();
    }
}
module.exports = Pill;
