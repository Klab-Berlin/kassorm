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
            var queryBuilder = cassanknex(keyspace);
            var cql = queryBuilder.createKeyspaceIfNotExists().withSimpleStrategy(1);
            var ready = connected.then(function () {
                return Q.nbind(cql.exec, cql)();
            });
            return Keyspace(qb(cassanknex)(keyspace), ready);
        }
    };
};

exports['@singleton'] = true;
exports['@require'] = ['KassormConfig'];