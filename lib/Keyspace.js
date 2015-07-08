var JsToKnex = require("../lib/JsToKnex");
var Model = require('./Model');
var Type = require('./Type');
var DbModel = require('./DbModel');

var Q = require("q");

var IoC = require('electrolyte');
var log = IoC.create("logger").createLogger("KEYSPACE");


var getValidator = function (field) {
    var types = field.knex.validators;
    if (!Array.isArray(types) || types.length == 0) {
        throw new Error("!Array.isArray(types) || types.length == 0");
    }
    if (types.length == 1) {
        return types[0];
    }

    return types.join("(") + types.map(function () {
            return ")";
        }).join("");

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

    var partition_keys_values = Object.keys(partition_keys).map(function (k) {
        return partition_keys[k];
    });

    var clustering_keys_values = Object.keys(clustering_keys).map(function (k) {
        return clustering_keys[k];
    });

    if (Object.keys(partition_keys).length > 0) {
        if (Object.keys(clustering_keys).length > 0) {
            cql.primary(partition_keys_values, clustering_keys_values);
        } else {
            cql.primary(partition_keys_values);
        }
    }

    return {
        indices: indices
    };
};

module.exports = function (queryBuilder, ready, cassanknex, keyspace) {

    var updateTable = function (tableName, schema) {
        return DbModel(cassanknex())
            .getTable(keyspace, tableName)
            .then(function (res) {

                var dbFields = {};
                res.forEach(function (r) {
                    dbFields[r.column_name] = r;
                });

                var expected = Object.keys(schema.keys).map(function (k) {
                    var res = schema.keys[k].knex;
                    res.validator = getValidator(schema.keys[k]);
                    res.column_name = k;
                    return res;
                });

                var changes = {
                    newFields: []
                };

                // TODO: check changes in:
                // - partition_keys
                // - clustering_keys

                expected.forEach(function (field) {
                    var dbField = dbFields[field.column_name];
                    if (!dbField) {
                        changes.newFields.push(field);
                    } else if (dbField.column_name.indexOf(field.column_name) !== 0) {
                        throw new Error("Field mismatch: " + dbField + "\nExpected: " + field);
                    } else {
                        // TODO: validate primary_keys & partition_keys
                    }
                });

                return changes.newFields;
            })
            .catch(log.error.bind(log));
    };

    var doUpdateTable = function (cql, newFields) {
        newFields.forEach(function (field) {
            cql[field.method](field.column_name, field.arg);
        });
        return Q.nbind(cql.exec, cql)();
    };

    //var createIndices = function (cassanKnex, indices, tableName) {
    //    indices.map(function (ind) {
    //        return cassanKnex().createIndexIfNotExists(tableName, ind.knex.index_name, ind.name);
    //    })
    //};

    return {
        createModel: function (name, schema) {
            return new Model({
                name: name,
                schema: schema,
                queryBuilder: queryBuilder,
                ready: ready
                    .then(function () {
                        var cql = queryBuilder().createColumnFamilyIfNotExists(name);
                        createDDL(cql, schema);
                        return Q.nbind(cql.exec, cql)();
                    })
                    .then(function () {
                        return updateTable(name, schema)
                            .then(doUpdateTable.bind(null, queryBuilder().alterColumnFamily(name)));
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
                ready: ready
                    .then(function () {
                        return Q.nbind(cql.exec, cql)();
                    })
                    //.then(function () {
                    //    return updateTable(name, schema)
                    //        .then(doUpdateTable.bind(null, queryBuilder().alterColumnFamily(name)));
                    //})

            });
        }
    };
};
