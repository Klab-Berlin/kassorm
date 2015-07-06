var JsToKnex = require("../lib/JsToKnex");
var Model = require('./Model');
var Type = require('./Type');
var Q = require("q");

var IoC = require('electrolyte');
var log = IoC.create("logger").createLogger("KEYSPACE");


var createDDL = function (cql, schema) {
    Object.keys(schema.keys)
        .map(function (k) {
            return {name: k, knex: JsToKnex(schema.keys[k])};
        })
        .forEach(function (field) {
            cql[field.knex.method](field.name, field.knex.arg);
            if (field.knex.primary) {
                cql.primary(field.name);
            }
        });
};

module.exports = function (queryBuilder, ready) {
    return {
        createModel: function (name, schema) {
            var cql = queryBuilder().createColumnFamilyIfNotExists(name);
            createDDL(cql, schema);
            return new Model({
                name: name,
                schema: schema,
                queryBuilder: queryBuilder,
                ready: ready.then(function () {
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
