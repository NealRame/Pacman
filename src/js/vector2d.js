class Vector2D {
    constructor({x = 0, y = 0} = {}) {
        this.x = x;
        this.y = y;
    }
    get norm() {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    }
    add(v) {
        return new Vector2D({x: this.x + v.x, y: this.y + v.y});
    }
    mul(k) {
        return new Vector2D({x: this.x*k, y: this.y*k});
    }
    sub(v) {
        return this.add(v.mul(-1));
    }
    unit() {
        let n = this.norm;
        return n !== 0 ? this.mul(1/n) : new Vector2D();
    }
    equal(v) {
        return this.x === v.x && this.y === v.y;
    }
    distance(v) {
        return v.sub(this).norm;
    }
    isNull() {
        return this.x === 0 && this.y === 0;
    }
    static fromPoint(p1, p2) {
        return new Vector2D({x: p2.x - p1.x, y: p2.y - p1.y});
    }
}

Object.defineProperty(Vector2D, 'NORTH', {
    enumerable: true,
    value: new Vector2D({x:  0, y: -1})
});
Object.defineProperty(Vector2D, 'EAST', {
    enumerable: true,
    value: new Vector2D({x:  1, y:  0})
});
Object.defineProperty(Vector2D, 'SOUTH', {
    enumerable: true,
    value: new Vector2D({x:  0, y:  1})
});
Object.defineProperty(Vector2D, 'WEST', {
    enumerable: true,
    value: new Vector2D({x: -1, y:  0})
});

module.exports = Vector2D;
