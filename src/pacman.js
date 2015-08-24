var functional = require('./functional');
var graphics = require('./graphics');
var MovingEntity = require('./moving-entity');
var Vector2D = require('./vector2d');

function *pacman_path_generator(n) {
    for (let i of functional.range(-n, n + 1)) {
        let theta = (n + 1 - Math.abs(i))*Math.PI/80;
        yield new Path2D(`
            M 0 0
            L ${Math.cos(theta)/2} ${Math.sin(theta)/2}
            A .5 .5 0 1 1 ${Math.cos(theta)/2} ${-Math.sin(theta)/2}
            L 0 0
        `);
    }
}

const [...PACMAN] = pacman_path_generator(19);
const OUTER_PACMAN_EYE = new Path2D(`
    M 0 0
    A .1428 .1428 0 1 1 0 .0001
`);
const INNER_PACMAN_EYE = new Path2D(`
    M 0 0
    A .0625 .0625 0 1 1 0 .0001
`);

class Pacman extends(MovingEntity) {
    constructor(name, [x = 0, y = 0] = []) {
        super([x, y]);
        this.name = name;
        this.index = 0;
    }
    _draw(scale) {
        graphics.push();
        graphics.translate({x: .5, y: .5});
        graphics.scale(0.8);
        if (this.direction.x < 0) {
            graphics.mirrorH();
        }
        if (this.direction.y < 0) {
            graphics.rotate(-Math.PI/2);
        }
        if (this.direction.y > 0) {
            graphics.rotate(Math.PI/2);
        }
        graphics.setPen({
            width: 1/scale
        });
        graphics.setBrush({
            color: '#ffdf00'
        });
        graphics.fillPath(PACMAN[this.index]);
        graphics.drawPath(PACMAN[this.index]);
        graphics.push();
        graphics.translate(new Vector2D([-1/7, -2/7]));
        graphics.setBrush({
            color: '#fff'
        });
        graphics.fillPath(OUTER_PACMAN_EYE);
        graphics.drawPath(OUTER_PACMAN_EYE);
        graphics.pop();
        graphics.translate(new Vector2D([-1/16, -2/7]));
        graphics.setBrush({
            color: '#000'
        });
        graphics.fillPath(INNER_PACMAN_EYE);
        graphics.pop();
        this.index = this.speed !== 0 ? (this.index + 1)%PACMAN.length : 0;
    }
}
module.exports = Pacman;
