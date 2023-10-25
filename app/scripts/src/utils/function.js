const { log, getConfig, getTargets, getOwnPropertyDescriptor, checkRegexs } = require("./utils");

const proxyFunction = (type, target) => {
    const config = getConfig(target);
    var [ parentObject, func ] = getTargets(target.split("."));

    if (!parentObject || !(func in parentObject)) {
        console.log(`[DOMLogger++] ${target} (function) does not exist!`);
        return;
    }

    if (!(typeof parentObject[func] === "function")) {
        console.log(`[DOMLogger++] ${target} is not a function!`);
        return;
    }

    // Non-configurable property can't be proxy
    if (!getOwnPropertyDescriptor(parentObject, func).configurable) {
        console.log(`[DOMLogger++] ${target} is not configurable, can't hook it!`);
        return;
    }

    const original = parentObject[func];
    parentObject[func] = new Proxy(parentObject[func], {
        apply: function(t, thisArg, args) {
            const keep = checkRegexs(config["match"], args, true);
            const remove = checkRegexs(config["!match"], args, false);

            if (config["hookFunction"])
                args = Function("args", config["hookFunction"])(args);

            if (!remove && keep) {
                log(type, target, JSON.stringify(args), config);
            }

            return Reflect.apply(original, thisArg, args);
        }
    });
}

module.exports = proxyFunction;
