var ck = require("cassanknex");
var Q = require('q');
var Keyspace = require("./Keyspace");

var IoC = require('electrolyte');
var log = IoC.create("logger").createLogger("KEYSPACE");

var qb = require("./QueryBuilder");

exports = module.exports = function (config, cassanknexConfig) {
    var ALLOW_DDL_CHANGES = Boolean(config.ALLOW_DDL_CHANGES);
    var cassanknex = ck(cassanknexConfig);
    var connected = Q.nbind(cassanknex.on, cassanknex, "ready")();
    return {
        createKeyspace: function (keyspaceName) {
            log.info("createKeyspace");
            var cql = cassanknex(keyspaceName).createKeyspaceIfNotExists().withSimpleStrategy(1);
            return connected
                .then(function () {
                    return Q.nbind(cql.exec, cql)();
                })
                .then(function () {
                    return Keyspace(qb(cassanknex)(keyspaceName), cassanknex, keyspaceName, ALLOW_DDL_CHANGES);
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

exports.MappingTypes = require("./MappingsTypes");
exports.SchemaFactory = require("./SchemaFactory");

exports['@singleton'] = true;
exports['@require'] = ['KassormConfig', 'cassanknexConfig'];