var Entity = require('./entity');
var graphics = require('./graphics');

class Biscuit extends Entity {
    constructor([x = 0, y = 0] = []) {
        super([x, y]);
        Object.defineProperty(this, 'points', {
            enumerable: true,
            get: () => 10
        });
    }
    _draw() {
        if (!this.eaten) {
            graphics.push();
            graphics.setBrush({
                color: '#000'
            });
            graphics.translate({x: .45, y: .45});
            graphics.fillRect({x: 0, y: 0}, .1, .1);
            graphics.pop();
        }
    }
}
module.exports = Biscuit;
