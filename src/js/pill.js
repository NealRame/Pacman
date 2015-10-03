import * as graphics from './graphics';
import Entity from './entity';
import Vector2D from './vector2d';

const path = new Path2D(`
    M .2 .5
    A .35 .35 0 1 1 .2 .5001
`);

export default class Pill extends Entity {
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
