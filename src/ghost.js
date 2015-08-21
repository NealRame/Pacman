var graphics = require('./graphics');

var MovingEntity = require('./moving-entity');
var Vector2D = require('./vector2d');

var ghost = new Path2D(`
    M 0 1
    V .3333
    C 0 .0833, .3333 0, .5 0
    S 1 .0833, 1 .3333
    V 1
    L .8333 .7777
    L .6666 1
    L .5 .7777
    L .3333 1
    L .1666 .7777
    L 0 1
`);

var outer_ghost_eye = new Path2D();
outer_ghost_eye.arc(0, 0,  1/7, 0, Math.PI*2);

var inner_ghost_eye = new Path2D();
inner_ghost_eye.arc(0, 0, 1/14, 0, Math.PI*2);

class Ghost extends(MovingEntity) {
    constructor(name, color = '#222', [x = 0, y = 0] = []) {
        super([x, y]);
        this.name = name;
        Object.defineProperty(this, 'color', {
            enumerable: true,
            get: () => color
        });
    }
    _draw(scale) {
        let eye_direction = this.velocity.mul(1/(15*this.velocity.norm));

        graphics.push();
        graphics.translate({x: .1, y: .1});
        graphics.scale(0.8);

        graphics.setPen({
            width: 1/scale
        });
        graphics.setBrush({
            color: this.color
        });
        graphics.fillPath(ghost);
        graphics.drawPath(ghost);

        graphics.translate(new Vector2D([9/32, 13/32]));
        graphics.setBrush({
            color: '#fff'
        });
        graphics.fillPath(outer_ghost_eye);
        graphics.drawPath(outer_ghost_eye);
        graphics.setBrush({
            color: '#000'
        });
        graphics.push();
        graphics.translate(eye_direction);
        graphics.fillPath(inner_ghost_eye);
        graphics.pop();

        graphics.translate(new Vector2D([14/32, 0]));
        graphics.setBrush({
            color: '#fff'
        });
        graphics.fillPath(outer_ghost_eye);
        graphics.drawPath(outer_ghost_eye);
        graphics.setBrush({
            color: '#000'
        });
        graphics.push();
        graphics.translate(eye_direction);
        graphics.fillPath(inner_ghost_eye);
        graphics.pop();

        graphics.pop();
    }
}

module.exports = Ghost;
