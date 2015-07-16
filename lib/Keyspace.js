var JsToKnex = require("../lib/JsToKnex");
var Model = require('./Model');
var Type = require('./Type');
var DbModel = require('./DbModel');

var Q = require("q");

var IoC = require('electrolyte');
var log = IoC.create("logger").createLogger("KEYSPACE");

var createDDL = function (cql, schema) {
    var partition_keys = {};
    var clustering_keys = {};
    var indices = [];

    var knex = JsToKnex(schema);

    Object.keys(knex.children)
        .map(function (k) {
            return {name: k, meta: knex.children[k]};
        })
        .forEach(function (field) {
            cql[field.meta.method].apply(cql, [field.name].concat(field.meta.args));

            if (field.meta.partition_key) {
                partition_keys[field.meta.component_index] = field.name;
            }

            if (field.meta.clustering_key) {
                clustering_keys[field.meta.component_index] = field.name;
            }

            if (field.meta.index) {
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

    // TODO: exec and then create indices

    return {
        indices: indices
    };
};

var getTableDbFields = function (dbSchema) {
    var dbFields = {};
    dbSchema.forEach(function (r) {
        dbFields[r.column_name] = r;
    });
    return dbFields;
};

var getTypeDbFields = function (dbSchema) {
    var schema = dbSchema[0];
    var dbFields = {};
    schema.field_names.forEach(function (f, i) {
        dbFields[f] = {
            validator: schema.field_types[i]
        };
    });

    return dbFields;
};

var getChanges = function (schema, dbFields) {
    var knex = JsToKnex(schema);
    var expected = Object.keys(knex.children).map(function (k) {
        var res = knex.children[k];
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
        } else if (dbField.validator.search(field.validator) !== 0) {
            var err = new Error("Validator mismatch for " + field.column_name + ": " + dbField.validator + "\nExpected: " + field.validator);
            log.error(err.stack);
            throw err;
        } else {
            // TODO: validate primary_keys, partition_keys and indices
        }
    });

    return changes.newFields;
};

module.exports = function (queryBuilder, cassanknex, keyspace, ALLOW_DDL_CHANGES, SKIP_DDL_CHANGES) {

    var updateSchema = function (cql, newFields) {
        if (newFields.length == 0 || SKIP_DDL_CHANGES) {
            return;
        }

        if(!ALLOW_DDL_CHANGES){
            log.error("New fields found: ", newFields);
            throw new Error("DDL changes not allowed! Set ALLOW_DDL_CHANGES: true to allow them.");
        }

        newFields.forEach(function (field) {
            cql[field.method].apply(cql, [field.column_name].concat(field.args));
        });

        return Q.nbind(cql.exec, cql)();
    };

    //var createIndices = function (cassanKnex, indices, tableName) {
    //    indices.map(function (ind) {
    //        return cassanKnex().createIndexIfNotExists(tableName, ind.knex.index_name, ind.name);
    //    })
    //};

    return {

        createModel: function (joiSchema) {
            var schema = joiSchema.describe();
            var knex = JsToKnex(schema);
            var name = knex.cql;
            var cql = queryBuilder().createColumnFamilyIfNotExists(name);
            createDDL(cql, schema);
            return (new Q())
                .then(function () {
                    return Q.nbind(cql.exec, cql)();
                })
                .then(function () {
                    return DbModel(cassanknex()).getTable(keyspace, name);
                })
                .then(getTableDbFields)
                .then(getChanges.bind(null, schema))
                .then(updateSchema.bind(null, queryBuilder().alterColumnFamily(name)))
                .then(function () {
                    return new Model({
                        name: name,
                        schema: schema,
                        joiSchema: joiSchema,
                        queryBuilder: queryBuilder
                    });
                });
        },

        createType: function (joiSchema) {
            var schema = joiSchema.describe();
            var knex = JsToKnex(schema);
            var name = knex.cql;
            var cql = queryBuilder().createTypeIfNotExists(name);
            createDDL(cql, schema);
            return (new Q())
                .then(function () {
                    return Q.nbind(cql.exec, cql)();
                })
                .then(function () {
                    return DbModel(cassanknex()).getType(keyspace, name);
                })
                .then(getTypeDbFields)
                .then(getChanges.bind(null, schema))
                .then(updateSchema.bind(null, queryBuilder().alterType(name)))
                .then(function () {
                    return new Type({
                        name: name,
                        schema: schema,
                        joiSchema: joiSchema,
                        queryBuilder: queryBuilder
                    });
                })
        },

        dropType: function (name) {
            var cql = queryBuilder().dropTypeIfExists(name);
            return Q.nbind(cql.exec, cql)();
        },

        dropTable: function (name) {
            var cql = queryBuilder().dropColumnFamilyIfExists(name);
            return Q.nbind(cql.exec, cql)();
        }

    };
};
