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
    "set": "org.apache.cassandra.db.marshal.SetType",
    "reversed_type": "org.apache.cassandra.db.marshal.ReversedType"
};

var getMeta = function (schema) {
    var meta = schema.describe().meta;
    if (meta.length !== 1) {
        throw new Error("unexpected meta.lenght");
    }
    return meta[meta.length - 1];
};

module.exports = {
    list: function (itemsSchema) {
        var meta = getMeta(itemsSchema);
        return Joi.array().items(itemsSchema).meta({
            cql: "list<" + meta.cql + ">",
            method: "list",
            arg: meta.cql,
            validator: TYPE_MAP.list + "(" + meta.validator + ")"
        });
    },
    blob: function () {
        return Joi.binary().meta({
            cql: "blob",
            method: "blob",
            validator: TYPE_MAP.blob
        });
    },
    timestamp: function () {
        return Joi.date().meta({
            cql: "timestamp",
            method: "timestamp",
            validator: TYPE_MAP.timestamp
        });
    },
    boolean: function () {
        return Joi.boolean().meta({
            cql: "boolean",
            method: "boolean",
            validator: TYPE_MAP.boolean
        });
    },
    bigint: function () {
        return Joi.number().integer().meta({
            cql: "bigint",
            method: "bigint",
            validator: TYPE_MAP.bigint
        });
    },
    double: function () {
        return Joi.number().meta({
            cql: "double",
            method: "double",
            validator: TYPE_MAP.double
        });
    },
    uuid: function () {
        return Joi.string().guid().meta({
            cql: "uuid",
            method: "uuid",
            validator: TYPE_MAP.uuid
        });
    },
    text: function () {
        return Joi.string().meta({
            cql: "text",
            method: "text",
            validator: TYPE_MAP.text
        });
    },
    nested: function (nestedSchema) {
        var meta = getMeta(nestedSchema);
        meta.arg = meta.cql;
        meta.method = "frozen";
        meta.validator = TYPE_MAP.udt;
        return nestedSchema;
    },
    frozen: function (nestedSchema) {
        var meta = getMeta(nestedSchema);
        if (meta.method === "list") {
            var method = "frozenList";
        } else {
            throw new Error("Cannot apply frozen to " + meta.method);
        }
        meta.method = method;
        meta.arg = meta.cql;
        meta.validator = TYPE_MAP.frozen + "(" + meta.validator + ")";
        return nestedSchema;
    },
    partition_key: function (itemSchema, index) {
        var meta = getMeta(itemSchema);
        index = index || 0;
        meta.partition_key = true;
        meta.component_index = index;
        return itemSchema;
    },
    reverse_clustering_key: function (itemSchema, index) {
        var meta = getMeta(itemSchema);
        index = index || 0;
        meta.reversed_type = true;
        meta.clustering_key = true;
        meta.component_index = index;
        meta.validator = TYPE_MAP.reversed_type + "(" + meta.validator + ")";
        return itemSchema;
    },
    clustering_key: function (itemSchema, index) {
        var meta = getMeta(itemSchema);
        index = index || 0;
        meta.clustering_key = true;
        meta.component_index = index;
        return itemSchema;
    },
    index: function (itemSchema, name) {
        var meta = getMeta(itemSchema);
        meta.index = true;
        meta.index_name = name;
        return itemSchema;
    }

};

