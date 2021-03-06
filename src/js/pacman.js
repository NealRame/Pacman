import {range} from './functional';
import * as graphics from'./graphics';
import MovingEntity from './moving-entity';
import Vector2D from './vector2d';

function *pacman_path_generator(n) {
    for (let i of range(-n, n + 1)) {
        if (i > -n && i < n) {
            const theta = (n + 1 - Math.abs(i))*Math.PI/80;
            yield new Path2D(`
                M .5 .5
                L ${.5 + Math.cos(theta)/2} ${.5 + Math.sin(theta)/2}
                A .5 .5 0 1 1 ${.5 + Math.cos(theta)/2} ${.5 - Math.sin(theta)/2}
                L .5 .5
            `);
        } else {
            yield new Path2D(`
                M 1 .5
                A .5 .5 0 1 0 1 .5001
            `);
        }
    }
}

function *dying_pacman_path_generator(n) {
    for (let i of range(0, n + 1)) {
        const theta = i*Math.PI/n;
        if (i === 0) {
            yield new Path2D(`
                M 1 .5
                A .5 .5 0 1 0 1 .5001
            `);
        } else if (i === n) {
            yield new Path2D();
        } else {
            yield new Path2D(`
                M .5 .5
                L ${.5 + Math.cos(theta)/2} ${.5 + Math.sin(theta)/2}
                A .5 .5 0 ${theta >= Math.PI/2 ? 0 : 1} 1 ${.5 + Math.cos(theta)/2} ${.5 - Math.sin(theta)/2}
                L .5 .5
            `);
        }
    }
}

const [...PACMAN] = pacman_path_generator(19);
const [...DYING_PACMAN] = dying_pacman_path_generator(38);

export default class Pacman extends MovingEntity {
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
        graphics.translate({x: -.4, y: -.4});
        graphics.scale(1.8);
        if (this.direction.x < 0) {
            graphics.translate({x:1, y: 0});
            graphics.mirrorH();
        }
        if (this.direction.y < 0) {
            graphics.translate({x:0, y: 1});
            graphics.rotate(-Math.PI/2);
        }
        if (this.direction.y > 0) {
            graphics.translate({x:1, y: 0});
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
            if (this.index < (DYING_PACMAN.length - 1)) {
                this.index++;
            }
        } else {
            graphics.fillPath(PACMAN[this.index]);
            this.index = this.direction.isNull() ? 0 : (this.index + 1)%PACMAN.length;
        }
        graphics.pop();
    }
}
