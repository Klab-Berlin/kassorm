module.exports = function (cassanknex) {
    return function (keyspace) {
        return function () {
            return cassanknex(keyspace);
        }
    };
};
