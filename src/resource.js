var Entity = require('./entity');
var graphics = require('./graphics');

class Resource extends Entity {
    constructor([x = 0, y = 0] = []) {
        super([x, y]);
    }
    _draw(scale) {
        graphics.push();
        graphics.setBrush({
            color: '#000'
        });
        graphics.translate({x: .45, y: .45});
        graphics.fillRect({x: 0, y: 0}, .1, .1);
        graphics.pop();
    }
}
module.exports = Resource;
