var Joi = require('joi');

// TODO: add counter
// TODO: add map


var TYPE_MAP = {
    "ascii": "org.apache.cassandra.db.marshal.AsciiType",
    "bigint": "org.apache.cassandra.db.marshal.LongType",
    "blob": "org.apache.cassandra.db.marshal.BytesType",
    "boolean": "org.apache.cassandra.db.marshal.BooleanType",
    "counter": "org.apache.cassandra.db.marshal.CounterColumnType",
    "decimal": "org.apache.cassandra.db.marshal.DecimalType",
    "double": "org.apache.cassandra.db.marshal.DoubleType",
    "float": "org.apache.cassandra.db.marshal.FloatType",
    "inet": "org.apache.cassandra.db.marshal.InetAddressType",
    "int": "org.apache.cassandra.db.marshal.Int32Type",
    "text": "org.apache.cassandra.db.marshal.UTF8Type",
    "timestamp": "org.apache.cassandra.db.marshal.TimestampType",
    "timeuuid": "org.apache.cassandra.db.marshal.TimeUUIDType",
    "uuid": "org.apache.cassandra.db.marshal.UUIDType",
    "varchar": "org.apache.cassandra.db.marshal.UTF8Type",
    "varint": "org.apache.cassandra.db.marshal.IntegerType",
    "udt": "org.apache.cassandra.db.marshal.UserType",
    "frozen": "org.apache.cassandra.db.marshal.FrozenType",
    "list": "org.apache.cassandra.db.marshal.ListType",
    "map": "org.apache.cassandra.db.marshal.MapType",
    "set": "org.apache.cassandra.db.marshal.SetType"
};


module.exports = {
    list: function (itemsSchema) {
        var res = Joi.array().items(itemsSchema);
        res.knex = {
            cql: "list<" + itemsSchema.knex.cql + ">",
            method: "list",
            arg: itemsSchema.knex.cql,
            validators: [].concat([TYPE_MAP.list], itemsSchema.knex.validators)

        };
        return res;
    },
    blob: function () {
        var res = Joi.binary();
        res.knex = {
            cql: "blob",
            method: "blob",
            validators: [TYPE_MAP.blob]
        };
        return res;
    },
    timestamp: function () {
        var res = Joi.date();
        res.knex = {
            cql: "timestamp",
            method: "timestamp",
            validators: [TYPE_MAP.timestamp]
        };
        return res;
    },
    boolean: function () {
        var res = Joi.boolean();
        res.knex = {
            cql: "boolean",
            method: "boolean",
            validators: [TYPE_MAP.boolean]
        };
        return res;
    },
    bigint: function () {
        var res = Joi.number().integer();
        res.knex = {
            cql: "bigint",
            method: "bigint",
            validators: [TYPE_MAP.bigint]
        };
        return res;
    },
    double: function () {
        var res = Joi.number();
        res.knex = {
            cql: "double",
            method: "double",
            validators: [TYPE_MAP.double]
        };
        return res;
    },
    uuid: function () {
        var res = Joi.string().guid();
        res.knex = {
            cql: "uuid",
            method: "uuid",
            validators: [TYPE_MAP.uuid]
        };
        return res;
    },
    text: function () {
        var res = Joi.string();
        res.knex = {
            cql: "text",
            method: "text",
            validators: [TYPE_MAP.text]
        };
        return res;
    },
    nested: function (nestedSchema) {
        var res = nestedSchema;
        res.knex = {
            cql: "frozen<" + nestedSchema.knex.cql + ">",
            method: "frozen",
            arg: nestedSchema.knex.cql,
            validators: [TYPE_MAP.udt]
        };
        return res;
    },
    frozen: function (nestedSchema) {
        var res = nestedSchema;
        res.knex = {
            cql: "frozen<" + nestedSchema.knex.cql + ">",
            method: "frozen",
            arg: nestedSchema.knex.cql,
            validators: [].concat([TYPE_MAP.frozen], nestedSchema.knex.validators)
        };
        return res;
    },
    partition_key: function (itemSchema, index) {
        index = index || 0;
        itemSchema.knex.partition_key = true;
        itemSchema.knex.component_index = index;
        return itemSchema;
    },
    clustering_key: function (itemSchema, index) {
        index = index || 0;
        itemSchema.knex.clustering_key = true;
        itemSchema.knex.component_index = index;
        return itemSchema;
    },
    index: function (itemSchema, name) {
        itemSchema.knex.index = true;
        itemSchema.knex.index_name = name;
        return itemSchema;
    }

};

