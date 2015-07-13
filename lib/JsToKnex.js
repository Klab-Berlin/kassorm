module.exports = function (descr) {
    var children = {};
    Object.keys(descr.children).map(function (k) {
        var meta = descr.children[k].meta;
        children[k] = meta[meta.length - 1];
    });

    return {
        cql: descr.meta[descr.meta.length - 1].cql,
        children: children
    };
};
