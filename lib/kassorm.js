var ck = require("cassanknex");
var Q = require('q');
var IoC = require('electrolyte');

exports = module.exports = function (config, cassanknexConfig) {
    var Keyspace = require("./Keyspace");
    var log = IoC.create("logger").createLogger("KEYSPACE");
    var DbModel = require('./DbModel');
    var qb = require("./QueryBuilder");

    var ALLOW_DDL_CHANGES = Boolean(config.ALLOW_DDL_CHANGES);
    var SKIP_DDL_CHANGES = Boolean(config.SKIP_DDL_CHANGES);
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
                    return Keyspace(qb(cassanknex)(keyspaceName), cassanknex, keyspaceName, ALLOW_DDL_CHANGES, SKIP_DDL_CHANGES);
                });
        },
        dropKeyspace: function (keyspace) {
            var cql = cassanknex().dropKeyspaceIfExists(keyspace);
            return connected.then(function () {
                return Q.nbind(cql.exec, cql)();
            });
        },
        getDbModel : function () {
            return DbModel(cassanknex);
        }
    };
};

exports.Mapper = require("./MappingsTypes");

exports['@singleton'] = true;
exports['@require'] = ['KassormConfig', 'cassanknexConfig'];


