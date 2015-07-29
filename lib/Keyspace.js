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
            var fieldName = field.name;
            if (fieldName.indexOf('_') == 0) {
                fieldName = "underscore" + fieldName;
            }

            cql[field.meta.method].apply(cql, [fieldName].concat(field.meta.args));

            if (field.meta.partition_key) {
                partition_keys[field.meta.component_index] = fieldName;
            }

            if (field.meta.clustering_key) {
                clustering_keys[field.meta.component_index] = fieldName;
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
    return dbSchema.reduce(function (dbFields, r) {
        dbFields[r.column_name] = r;
        return dbFields;
    }, {});
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

var checkValidatorType = function (fieldName, field, dbField) {
    if (dbField.validator.search(field.validator) !== 0) {
        throw new Error("Validator mismatch for " + fieldName + ": " + dbField.validator + "\nExpected: " + field.validator);
    }
};

var checkPartitionKey = function (fieldName, field, dbField) {
    var isFieldPartitionKey = Boolean(field.partition_key);
    var isDbFieldPartitionKey = dbField.type === "partition_key";
    if(isFieldPartitionKey !== isDbFieldPartitionKey){
        throw new Error("Partition key mismatch for " + fieldName);
    }
    if(field.partition_key && dbField.component_index !== field.component_index){
        throw new Error("Partition key index mismatch for " + fieldName);
    }
};

var checkClusteringKey = function (fieldName, field, dbField) {
};

var getNewFields = function (schema, dbFields) {
    var knex = JsToKnex(schema);
    var expected = Object.keys(knex.children).map(function (k) {
        var res = knex.children[k];
        res.column_name = k;
        return res;
    });

    return expected.reduce(function (acc, field) {
        var fieldName = field.column_name;
        if (fieldName.indexOf('_') == 0) {
            fieldName = "underscore" + fieldName;
        }

        var dbField = dbFields[fieldName];
        if (!dbField) {
            acc.push(field);
            // TODO: add new indices and remove the old ones
        } else {
            checkValidatorType(fieldName, field, dbField);
            checkPartitionKey(fieldName, field, dbField);
            checkClusteringKey(fieldName, field, dbField);

            // TODO: validate primary_keys, partition_keys

        }
        return acc;
    }, []);

};

module.exports = function (queryBuilder, cassanknex, keyspace, ALLOW_DDL_CHANGES, SKIP_DDL_CHANGES) {

    var updateSchema = function (cql, newFields) {
        if (newFields.length == 0 || SKIP_DDL_CHANGES) {
            return;
        }

        if (!ALLOW_DDL_CHANGES) {
            log.error("New fields found: ", newFields);
            throw new Error("DDL changes not allowed! Set ALLOW_DDL_CHANGES: true to allow them.");
        }

        newFields.forEach(function (field) {
            log.debug("adding: ", field.method, field.column_name, field.args);
            cql[field.method].apply(cql, [field.column_name].concat(field.args));
        });

        return Q.nfcall(cql.exec);
    };

    //var createIndices = function (cassanKnex, indices, tableName) {
    //    indices.map(function (ind) {
    //        return cassanKnex().createIndexIfNotExists(tableName, ind.knex.index_name, ind.name);
    //    })
    //};

    var _createTable = function (name, schema) {
        var cql = queryBuilder().createColumnFamilyIfNotExists(name);
        createDDL(cql, schema);
        return Q.nfcall(cql.exec);
    };

    var _createType = function (name, schema) {
        var cql = queryBuilder().createTypeIfNotExists(name);
        createDDL(cql, schema);
        return Q.nfcall(cql.exec);
    };

    var _updateTable = function (name, schema, dbschema) {
        var cql = queryBuilder().alterColumnFamily(name);
        var dbFields = getTableDbFields(dbschema);
        var newFields = getNewFields(schema, dbFields);
        return updateSchema(cql, newFields);
    };

    var _updateType = function (name, schema, dbschema) {
        var cql = queryBuilder().alterType(name);
        var dbFields = getTypeDbFields(dbschema);
        var newFields = getNewFields(schema, dbFields);
        return updateSchema(cql, newFields);
    };

    return {

        createModel: function (joiSchema, preWriteTransform) {
            var schema = joiSchema.describe();
            var knex = JsToKnex(schema);
            var name = knex.cql;

            return DbModel(cassanknex).getTable(keyspace, name)
                .then(function (dbSchema) {
                    if (dbSchema == null) {
                        return _createTable(name, schema);
                    } else {
                        return _updateTable(name, schema, dbSchema);
                    }
                }).then(function () {
                    return new Model({
                        name: name,
                        schema: schema,
                        joiSchema: joiSchema,
                        queryBuilder: queryBuilder,
                        preWriteTransform: preWriteTransform
                    });
                });
        },

        createType: function (joiSchema) {
            var schema = joiSchema.describe();
            var knex = JsToKnex(schema);
            var name = knex.cql;

            return DbModel(cassanknex).getType(keyspace, name)
                .then(function (dbSchema) {
                    if (dbSchema == null) {
                        return _createType(name, schema);
                    } else {
                        return _updateType(name, schema, dbSchema);
                    }
                }).then(function () {
                    return new Type({
                        name: name,
                        schema: schema,
                        joiSchema: joiSchema,
                        queryBuilder: queryBuilder
                    });
                });
        },

        dropType: function (name) {
            var cql = queryBuilder().dropTypeIfExists(name);
            return Q.nfcall(cql.exec);
        },

        dropTable: function (name) {
            var cql = queryBuilder().dropColumnFamilyIfExists(name);
            return Q.nfcall(cql.exec);
        }

    };
};
