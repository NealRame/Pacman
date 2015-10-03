export function existy(value) {
    return value != null;
}

export function cat(head, ...args) {
    return existy(head) ? head.concat.apply(head, args) : [];
}

export function construct(head, tail) {
    return [head, ...tail];
}

export function dispatch(...funs) {
    return function(...args) {
        for (let fun of funs) {
            let ret = fun(...args);
            if (existy(ret)) {
                return ret;
            }
        }
    };
}

export function *range(first, last, step = 1) {
    for (let i = first; i < last; i += step) {
        yield i;
    }
}
