var Entity = require('./entity');
var graphics = require('./graphics');
var Vector2D = require('./vector2d');

class Biscuit extends Entity {
    constructor(pos = new Vector2D()) {
        super(pos);
        Object.defineProperty(this, 'points', {
            enumerable: true,
            get: () => 10
        });
    }
    _draw() {
        if (!this.eaten) {
            graphics.push();
            graphics.setBrush({
                color: '#FFB9AF'
            });
            graphics.translate({x: .4, y: .4});
            graphics.fillRect({x: 0, y: 0}, .2, .2);
            graphics.pop();
        }
    }
}
module.exports = Biscuit;
