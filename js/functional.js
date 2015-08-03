/* global _:false */
/* eslint-disable strict */
(function(namespace) {
    var module = window[namespace] || (window[namespace] = {});

    function existy(value) {
        return value != null;
    }

    function cat() {
		var head = _.first(arguments);
        return existy(head) ? head.concat.apply(head, _.rest(arguments)) : [];
	}

	function construct(head, tail) {
		return cat([head], _.toArray(tail));
	}

    function dispatch() {
        var funs = _.toArray(arguments);
        var size = funs.length;
        return function(target) {
            var args = _.rest(arguments);
            for (var index = 0; index < size; index++) {
                var fun = funs[index];
                var ret = fun.apply(this, construct(target, args));
                if (!_.isUndefined(ret)) {
                    return ret;
                }
            }
        };
    }

    module.existy = existy;
    module.cat = cat;
    module.construct = construct;
    module.dispatch = dispatch;

})('functional');
