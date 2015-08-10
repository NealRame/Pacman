var _ = require('underscore');
var canvas = document.getElementById('graphics');

if (!canvas) {
    throw Error('No canvas#graphics found!');
}

var context = canvas.getContext('2d');

function snap(x) {
    var w = context.lineWidth;
    return Math.round(w) === w && (w % 2) === 0 ? x : Math.round(x) + 0.5;
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

exports.setPen = function(pen) {
    context.strokeStyle = pen.color;
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

exports.drawLine = function(x1, y1, x2, y2) {
    context.beginPath();
    context.moveTo(snap(x1), snap(y1));
    context.lineTo(snap(x2), snap(y2));
    context.closePath();
    context.stroke();
};

exports.drawRect = function(x, y, w, h) {
    context.strokeRect(snap(x), snap(y), w, h);
};

exports.fillRect = function(x, y, w, h) {
    context.fillRect(snap(x), snap(y), w, h);
};
