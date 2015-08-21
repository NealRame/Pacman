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
    static fromPoint([x1, y1], [x2, y2]) {
        return new Vector2D([x2 - x1, y2 - y1]);
    }
}
module.exports = Vector2D;
