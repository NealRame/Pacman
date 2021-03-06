const tasks = new Map();

let next_task_id = 1;
let start, ticks;

function run_expired_task() {
    for (let [id, entry] of tasks) {
        if (entry.expiry < ticks) {
            let {wait, task} = entry.task();
            if (wait) {
                put_task(id, wait, task);
            } else {
                tasks.delete(id);
            }
        }
    }
}

function put_task(id, wait, task) {
    tasks.set(id, {expiry: ticks + wait, task});
    return id;
}

class Sequence {
    constructor() {
        let sequence = [];
        let ended = false;
        this.delay = (wait, task) => {
            if (!ended) {
                sequence = [[wait, task]].concat(sequence);
                return this;
            }
            throw new Error('Sequence has been ended');
        };
        this.end = () => {
            function aux() {
                if (sequence.length > 0) {
                    let [wait, task] = sequence.pop();
                    return {
                        wait,
                        task: function() {
                            task();
                            return aux();
                        }
                    };
                }
                return {};
            }
            if (!ended) {
                let {wait, task} = aux();
                ended = true;
                return put_task(next_task_id++, wait, task);
            }
            throw new Error('Sequence has been ended');
        };
    }
}

export function begin() {
    return new Sequence();
}

export function cancel(task_id) {
    tasks.delete(task_id);
}

export function cancelAll() {
    tasks.clear();
}

export function delay(wait, task) {
    return put_task(
        next_task_id++,
        wait,
        () => {
            task();
            return {};
        }
    );
}

export function update(timestamp) {
    if (!start) {
        start = timestamp;
    }
    ticks = timestamp - start;
    run_expired_task();
}
