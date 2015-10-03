import {isString, isNumber} from 'util';

export const canvas = document.getElementById('graphics');

if (!canvas) {
    throw Error('No canvas#graphics found!');
}

const context = canvas.getContext('2d');

let snap_by_stack = [];
let snap_by = 0.5;

function snap(x) {
    var w = context.lineWidth;
    return Math.round(w) === w && (w % 2) === 0 ? x : Math.round(x) + snap_by;
}

export function Pen({width = 1., color = '#000'} = {}) {
    /* eslint-disable no-underscore-dangle */
    var width_, color_;
    Object.defineProperty(this, 'width', {
        enumerable: true,
        get: function() {
            return width_;
        },
        set: function(w) {
            if (!isNumber(w)) {
                throw new TypeError('width must be a number!');
            }
            width_ = w;
        }
    });
    Object.defineProperty(this, 'color', {
        enumerable: true,
        get: function() {
            return color_;
        },
        set: function(c) {
            if (!isString(c)) {
                throw new TypeError('color must be a string');
            }
            color_ = c;
        }
    });
    this.width = width;
    this.color = color;
    /* eslint-disable no-underscore-dangle */
}

export function Brush({color = '#000'} = {}) {
    /* eslint-disable no-underscore-dangle */
    let color_;
    Object.defineProperty(this, 'color', {
        enumerable: true,
        get: function() {
            return color_;
        },
        set: function(c) {
            if (!isString(c)) {
                throw new TypeError('color must be a string');
            }
            color_ = c;
        }
    });
    this.color = color;
    /* eslint-disable no-underscore-dangle */
}

export function clear() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

export function size() {
    return {
        width: canvas.width, height: canvas.height
    };
}

export function setPen(pen) {
    context.strokeStyle = pen.color || '#000';
    context.lineWidth = pen.width;
}

export const pen = function () {
    return new Pen(context.lineWidth, context.strokeStyle);
};

export function setBrush(brush) {
    context.fillStyle = brush.color;
}

export const brush = function() {
    return new Brush(context.fillStyle);
};

export function drawLine({x: x1 = 0, y: y1 = 0} = {}, {x: x2 = 0, y: y2 = 0} = {}) {
    context.beginPath();
    context.moveTo(snap(x1), snap(y1));
    context.lineTo(snap(x2), snap(y2));
    context.closePath();
    context.stroke();
}

export function drawRect({x = 0, y = 0} = {}, w = 0, h = 0) {
    context.strokeRect(snap(x), snap(y), w, h);
}

export function fillRect({x = 0, y = 0} = {}, w = 0, h = 0) {
    context.fillRect(snap(x), snap(y), w, h);
}

export function drawPath(path) {
    context.stroke(path);
}

export function fillPath(path) {
    context.fill(path);
}

export function translate({x = 0, y = 0} = {}) {
    context.translate(x, y);
}

export function scale(k = 1) {
    snap_by = snap_by/k;
    context.scale(k, k);
}

export function mirrorH() {
    context.scale(-1, 1);
}

export function mirrorV() {
    context.scale(1, -1);
}

export function rotate(angle) {
    context.rotate(angle);
}

export function push() {
    snap_by_stack.push(snap_by);
    context.save();
}

export function pop() {
    snap_by = snap_by_stack.pop();
    context.restore();
}
