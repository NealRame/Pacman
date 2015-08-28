var EventEmitter = require('events').EventEmitter;
var graphics = require('./graphics');
var Vector2D = require('./vector2d');

class Entity extends EventEmitter {
    constructor([x = 0, y = 0] = []) {
        super();
        let pos = new Vector2D([x, y]);
        let eaten = false;
        Object.defineProperty(this, 'x', {
            enumerable: true,
            get: () => pos.x,
            set: v => pos.x = v
        });
        Object.defineProperty(this, 'y', {
            enumerable: true,
            get: () => pos.y,
            set: v => pos.y = v
        });
        Object.defineProperty(this, 'position', {
            enumerable: true,
            get: () => pos,
            set: (p) => pos = p
        });
        Object.defineProperty(this, 'eaten', {
            enumerable: true,
            get: () => eaten,
            set: (b) => {
                if ((eaten = b)) {
                    this.emit('eaten', this);
                }
            }
        });
    }
    draw(scale = 1) {
        /* eslint-disable no-underscore-dangle */
        if (this._draw instanceof Function) {
            graphics.push();
            graphics.scale(scale);
            graphics.translate(this.position);
            this._draw(scale);
            graphics.pop();
        }
        /* eslint-enable no-underscore-dangle */
    }
}
module.exports = Entity;
