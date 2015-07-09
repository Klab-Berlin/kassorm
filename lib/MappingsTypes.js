var Joi = require('joi');

// TODO: add counter
// TODO: add map


var TYPE_MAP = {
    "ascii": "org.apache.cassandra.db.marshal.AsciiType".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "bigint": "org.apache.cassandra.db.marshal.LongType".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "blob": "org.apache.cassandra.db.marshal.BytesType".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "boolean": "org.apache.cassandra.db.marshal.BooleanType".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "counter": "org.apache.cassandra.db.marshal.CounterColumnType".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "decimal": "org.apache.cassandra.db.marshal.DecimalType".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "double": "org.apache.cassandra.db.marshal.DoubleType".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "float": "org.apache.cassandra.db.marshal.FloatType".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "inet": "org.apache.cassandra.db.marshal.InetAddressType".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "int": "org.apache.cassandra.db.marshal.Int32Type".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "text": "org.apache.cassandra.db.marshal.UTF8Type".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "timestamp": "org.apache.cassandra.db.marshal.TimestampType".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "timeuuid": "org.apache.cassandra.db.marshal.TimeUUIDType".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "uuid": "org.apache.cassandra.db.marshal.UUIDType".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "varchar": "org.apache.cassandra.db.marshal.UTF8Type".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "varint": "org.apache.cassandra.db.marshal.IntegerType".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "udt": "org\.apache\.cassandra\.db\.marshal\.UserType\((.*)\)",
    "frozen": "org.apache.cassandra.db.marshal.FrozenType".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "list": "org.apache.cassandra.db.marshal.ListType".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "map": "org.apache.cassandra.db.marshal.MapType".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "set": "org.apache.cassandra.db.marshal.SetType".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
    "reversed_type": "org.apache.cassandra.db.marshal.ReversedType".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
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
            args: [meta.cql],
            validator: TYPE_MAP.list + "\x5C(" + meta.validator + "\x5C)"
        });
    },
    map: function (keyItemsSchema, valueItemsSchema) {
        var kMeta = getMeta(keyItemsSchema);
        var vMeta = getMeta(valueItemsSchema);

        return Joi.object().meta({
            cql: "map<" + kMeta.cql + ", " + vMeta.cql + ">",
            method: "map",
            args: [kMeta.cql, vMeta.cql],
            validator: TYPE_MAP.map + "\x5C(" + kMeta.validator + "," + vMeta.validator + "\x5C)"
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
        meta.args = [meta.cql];
        meta.cql = "frozen<" + meta.cql + ">";
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
        meta.args = [meta.cql];
        meta.cql = "frozen<" + meta.cql + ">";
        meta.validator = TYPE_MAP.frozen + "\x5C(" + meta.validator + "\x5C)";
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
        meta.validator = TYPE_MAP.reversed_type + "\x5C(" + meta.validator + "\x5C)";
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

