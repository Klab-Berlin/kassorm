var Q = require('q');
var Keyspace = require("./Keyspace");

var IoC = require('electrolyte');
var log = IoC.create("logger").createLogger("KEYSPACE");

var qb = require("./QueryBuilder");

exports = module.exports = function (config) {
    var cassanknex = require("cassanknex")(config);
    var connected = Q.nbind(cassanknex.on, cassanknex, "ready")();
    return {
        createKeyspace: function (keyspace) {
            log.info("createKeyspace");
            var cql = cassanknex(keyspace).createKeyspaceIfNotExists().withSimpleStrategy(1);
            return connected
                .then(function () {
                    return Q.nbind(cql.exec, cql)();
                })
                .then(function () {
                    return Keyspace(qb(cassanknex)(keyspace), cassanknex, keyspace);
                });
        },
        dropKeyspace: function (keyspace) {
            var cql = cassanknex().dropKeyspaceIfExists(keyspace);
            return connected.then(function () {
                return Q.nbind(cql.exec, cql)();
            });
        }
    };
};

exports['@singleton'] = true;
exports['@require'] = ['KassormConfig'];