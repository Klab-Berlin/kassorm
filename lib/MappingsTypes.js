var Joi = require('joi');

// TODO: add counter
// TODO: add map
// TODO: add frozen

module.exports = {
    list: function (itemsSchema) {
        var res = Joi.array().items(itemsSchema);
        res.knex = {
            cql: "list<" + itemsSchema.knex.cql + ">",
            method: "list",
            arg: itemsSchema.knex.cql
        };
        return res;
    },
    blob: function () {
        var res = Joi.binary();
        res.knex = {
            cql: "blob",
            method: "blob"
        };
        return res;
    },
    timestamp: function () {
        var res = Joi.date();
        res.knex = {
            cql: "timestamp",
            method: "timestamp"
        };
        return res;
    },
    boolean: function () {
        var res = Joi.boolean();
        res.knex = {
            cql: "boolean",
            method: "boolean"
        };
        return res;
    },
    bigint: function () {
        var res = Joi.number().integer();
        res.knex = {
            cql: "bigint",
            method: "bigint"
        };
        return res;
    },
    double: function () {
        var res = Joi.number();
        res.knex = {
            cql: "double",
            method: "double"
        };
        return res;
    },
    uuid: function () {
        var res = Joi.string().guid();
        res.knex = {
            cql: "uuid",
            method: "uuid"
        };
        return res;
    },
    text: function () {
        var res = Joi.string();
        res.knex = {
            cql: "text",
            method: "text"
        };
        return res;
    },
    nested: function (nestedSchema) {
        var res = nestedSchema;
        res.knex = {
            cql: "frozen<" + nestedSchema.knex.cql + ">"
        };
        return res;
    }
};

