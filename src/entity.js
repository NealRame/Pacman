var EventEmitter = require('events').EventEmitter;
var graphics = require('./graphics');
var Vector2D = require('./vector2d');

class Entity extends EventEmitter {
    constructor(pos = new Vector2D()) {
        super();
        let _eaten = false; // eslint-disable-line no-underscore-dangle
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
            get: () => _eaten,
            set: (b) => {
                if ((_eaten = b)) {
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
