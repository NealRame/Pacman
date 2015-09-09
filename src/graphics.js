var _ = require('underscore');

var canvas = document.getElementById('graphics');

if (!canvas) {
    throw Error('No canvas#graphics found!');
}

var context = canvas.getContext('2d');

var snap_by_stack = [];
var snap_by = 0.5;

function snap(x) {
    var w = context.lineWidth;
    return Math.round(w) === w && (w % 2) === 0 ? x : Math.round(x) + snap_by;
}

function Pen({width = 1., color = '#000'} = {}) {
    /* eslint-disable no-underscore-dangle */
    var width_, color_;
    Object.defineProperty(this, 'width', {
        enumerable: true,
        get: function() {
            return width_;
        },
        set: function(w) {
            if (!_.isNumber(w)) {
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
            if (!_.isString(c)) {
                throw new TypeError('color must be a string');
            }
            color_ = c;
        }
    });
    this.width = width;
    this.color = color;
    /* eslint-disable no-underscore-dangle */
}

function Brush({color = '#000'} = {}) {
    /* eslint-disable no-underscore-dangle */
    var color_;
    Object.defineProperty(this, 'color', {
        enumerable: true,
        get: function() {
            return color_;
        },
        set: function(c) {
            if (!_.isString(c)) {
                throw new TypeError('color must be a string');
            }
            color_ = c;
        }
    });
    this.color = color;
    /* eslint-disable no-underscore-dangle */
}

exports.clear = function() {
    context.clearRect(0, 0, canvas.width, canvas.height);
};

exports.Pen = Pen;
exports.Brush = Brush;

exports.size = function() {
    return {
        width: canvas.width, height: canvas.height
    };
};

exports.setPen = function(pen) {
    context.strokeStyle = pen.color || '#000';
    context.lineWidth = pen.width;
};

exports.pen = function() {
    return new Pen(context.lineWidth, context.strokeStyle);
};

exports.setBrush = function(brush) {
    context.fillStyle = brush.color;
};

exports.brush = function() {
    return new Brush(context.fillStyle);
};

exports.drawLine = function({x: x1 = 0, y: y1 = 0} = {}, {x: x2 = 0, y: y2 = 0} = {}) {
    context.beginPath();
    context.moveTo(snap(x1), snap(y1));
    context.lineTo(snap(x2), snap(y2));
    context.closePath();
    context.stroke();
};

exports.drawRect = function({x = 0, y = 0} = {}, w = 0, h = 0) {
    context.strokeRect(snap(x), snap(y), w, h);
};

exports.fillRect = function({x = 0, y = 0} = {}, w = 0, h = 0) {
    context.fillRect(snap(x), snap(y), w, h);
};

exports.drawPath = function(path) {
    context.stroke(path);
};

exports.fillPath = function(path) {
    context.fill(path);
};

exports.translate = function({x = 0, y = 0} = {}) {
    context.translate(x, y);
};

exports.scale = function(k = 1) {
    snap_by = snap_by/k;
    context.scale(k, k);
};

exports.mirrorH = function() {
    context.scale(-1, 1);
};

exports.mirrorV = function() {
    context.scale(1, -1);
};

exports.rotate = function(angle) {
    context.rotate(angle);
}

exports.push = function() {
    snap_by_stack.push(snap_by);
    context.save();
};

exports.pop = function() {
    snap_by = snap_by_stack.pop();
    context.restore();
};
