var functional = require('./functional');
var graphics = require('./graphics');
var MovingEntity = require('./moving-entity');
var Vector2D = require('./vector2d');

function *pacman_path_generator(n) {
    for (let i of functional.range(-n, n + 1)) {
        if (i > -n && i < n) {
            let theta = (n + 1 - Math.abs(i))*Math.PI/80;
            yield new Path2D(`
                M 0 0
                L ${Math.cos(theta)/2} ${Math.sin(theta)/2}
                A .5 .5 0 1 1 ${Math.cos(theta)/2} ${-Math.sin(theta)/2}
                L 0 0
            `);
        } else {
            yield new Path2D(`
                M .5 0
                A .5 .5 0 1 1 .5 -.0001
                L .5 0
            `);
        }
    }
}

function *dying_pacman_path_generator(n) {
    for (let i of functional.range(0, n + 1)) {
        let theta = i*Math.PI/n;
        if (i === 0) {
            yield new Path2D(`
                M .5 0
                A .5 .5 0 1 1 .5 -.0001
                L .5 0
            `);
        } else if (i === n) {
            yield new Path2D();
        } else {
            yield new Path2D(`
                M 0 0
                L ${Math.cos(theta)/2}, ${Math.sin(theta)/2}
                A .5 .5 0 ${i > n/2 ? 0 : 1} 1 ${Math.cos(theta)/2} ${-Math.sin(theta)/2}
                L 0 0
            `);
        }
    }
}

const [...PACMAN] = pacman_path_generator(19);
const [...DYING_PACMAN] = dying_pacman_path_generator(38);

class Pacman extends(MovingEntity) {
    constructor(name, pos = new Vector2D(), speed = 0) {
        super(pos, speed);
        this.name = name;
        this.index = 0;
        this.on('eaten', () => {
            this.index = 0;
        });
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
        if (this.eaten) {
            graphics.fillPath(DYING_PACMAN[this.index]);
            graphics.drawPath(DYING_PACMAN[this.index]);
            if (this.index < (DYING_PACMAN.length - 1)) {
                this.index++;
            }
        } else {
            graphics.fillPath(PACMAN[this.index]);
            graphics.drawPath(PACMAN[this.index]);

            this.index = this.direction.isNull() ? 0 : (this.index + 1)%PACMAN.length;
        }
        graphics.pop();
    }
}
module.exports = Pacman;
