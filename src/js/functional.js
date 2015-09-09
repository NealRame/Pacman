function existy(value) {
    return value != null;
}

function cat(head, ...args) {
    return existy(head) ? head.concat.apply(head, args) : [];
}

function construct(head, tail) {
    return [head, ...tail];
}

function dispatch(...funs) {
    return function(...args) {
        for (let fun of funs) {
            let ret = fun(...args);
            if (existy(ret)) {
                return ret;
            }
        }
    };
}

function *range(first, last, step = 1) {
    for (let i = first; i < last; i += step) {
        yield i;
    }
}

exports.existy = existy;
exports.cat = cat;
exports.construct = construct;
exports.dispatch = dispatch;
exports.range = range;
