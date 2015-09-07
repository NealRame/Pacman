class Vector2D {
    constructor([x = 0, y = 0] = []) {
        this.x = x;
        this.y = y;
    }
    get norm() {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    }
    add(v) {
        return new Vector2D([this.x + v.x, this.y + v.y]);
    }
    mul(k) {
        return new Vector2D([this.x*k, this.y*k]);
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
    static fromPoint(p1, p2) {
        return new Vector2D([p2.x - p1.x, p2.y - p1.y]);
    }
}
module.exports = Vector2D;
