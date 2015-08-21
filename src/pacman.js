var graphics = require('./graphics');

var MovingEntity = require('./moving-entity');
var Vector2D = require('./vector2d');

const pacman = new Path2D(`
M 0 0
L .4504 .2169
A .5 .5 0 1 1 .4504 -.2169
L 0 0
`);
const outer_pacman_eye = new Path2D(`
M 0 0
A .1428 .1428 0 1 1 0 .0001
`);
const inner_pacman_eye = new Path2D(`
M 0 0
A .0625 .0625 0 1 1 0 .0001
`);

class Pacman extends(MovingEntity) {
    constructor(name, [x = 0, y = 0] = []) {
        super([x, y]);
        this.name = name;
    }
    _draw(scale) {
        graphics.push();
        graphics.translate({x: .5, y: .5});
        graphics.scale(0.8);
        graphics.setPen({
            width: 1/scale
        });
        graphics.setBrush({
            color: '#ffdf00'
        });
        graphics.fillPath(pacman);
        graphics.drawPath(pacman);
        graphics.push();
        graphics.translate(new Vector2D([-1/7, -2/7]));
        graphics.setBrush({
            color: '#fff'
        });
        graphics.fillPath(outer_pacman_eye);
        graphics.drawPath(outer_pacman_eye);
        graphics.pop();
        graphics.translate(new Vector2D([-1/16, -2/7]));
        graphics.setBrush({
            color: '#000'
        });
        graphics.fillPath(inner_pacman_eye);
        graphics.pop();
    }
}
module.exports = Pacman;
