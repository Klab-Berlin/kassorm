var JsToKnex = require("../lib/JsToKnex");
var Model = require('./Model');
var Type = require('./Type');
var DbModel = require('./DbModel');

var Q = require("q");

var IoC = require('electrolyte');
var log = IoC.create("logger").createLogger("KEYSPACE");



var getValidator = function (field) {
    var type = field.knex.cql
};

var createDDL = function (cql, schema) {
    var partition_keys = {};
    var clustering_keys = {};
    var indices = [];

    Object.keys(schema.keys)
        .map(function (k) {
            return {name: k, knex: JsToKnex(schema.keys[k])};
        })
        .forEach(function (field) {
            cql[field.knex.method](field.name, field.knex.arg);

            if (field.knex.partition_key) {
                partition_keys[field.knex.component_index] = field.name;
            }

            if (field.knex.clustering_key) {
                clustering_keys[field.knex.component_index] = field.name;
            }

            if (field.knex.index) {
                indices.push(field);
            }

        });

    if (partition_keys.length <= 0) {
        throw new Error("no partition_keys found");
    }

    cql.primary.call(cql.primary, partition_keys, clustering_keys);

    return {
        indices: indices
    };
};

module.exports = function (queryBuilder, ready, cassanknex, keyspace) {
    //function getValidator(key) {
    //    TYPE_MAP[key];
    //}

    var updateTable = function (table, schema) {
        return DbModel(cassanknex)
            .getTable(keyspace, table)
            .then(function (res) {
                if (res == null) {
                    log.warn("non existing table");
                    return;
                }

                Object.keys(schema.keys)
                    .map(function (k) {
                        return {column_name: k, validator: getValidator(schema[k])};
                    });


                // TODO: impl update

            })
            .catch(log.error.bind(log));
    };

    var createIndices = function (cassanKnex, indices, tableName) {
        indices.map(function (ind) {
            return cassanKnex().createIndexIfNotExists(tableName, ind.knex.index_name, ind.name);
        })
    };

    return {
        createModel: function (name, schema) {
            return new Model({
                name: name,
                schema: schema,
                queryBuilder: queryBuilder,
                ready: ready
                    .then(function () {
                        return updateTable(name, schema);
                    })
                    .then(function () {
                        var cql = queryBuilder().createColumnFamilyIfNotExists(name);
                        createDDL(cql, schema);
                        return Q.nbind(cql.exec, cql)();
                    })
            });
        },
        createType: function (name, schema) {
            var cql = queryBuilder().createTypeIfNotExists(name);
            createDDL(cql, schema);
            return new Type({
                name: name,
                schema: schema,
                queryBuilder: queryBuilder,
                ready: ready.then(function () {
                    return Q.nbind(cql.exec, cql)();
                })
            });
        }
    };
};
