const EventEmitter = require('events').EventEmitter;
const graphics = require('./graphics');
const Vector2D = require('./vector2d');

class Entity extends EventEmitter {
    constructor(pos = new Vector2D()) {
        super();
        let _eaten = false;  // eslint-disable-line no-underscore-dangle
        let _position = pos; // eslint-disable-line no-underscore-dangle
        Object.defineProperty(this, 'x', {
            enumerable: true,
            get: () => _position.x,
            set: v => _position.x = v
        });
        Object.defineProperty(this, 'y', {
            enumerable: true,
            get: () => _position.y,
            set: v => _position.y = v
        });
        Object.defineProperty(this, 'position', {
            enumerable: true,
            get: () => _position,
            set: (p) => _position = p
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
    reset() {
        this.eaten = false;
        this.emit('reset', this);
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
