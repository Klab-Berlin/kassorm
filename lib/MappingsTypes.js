var Joi = require('joi');

// TODO: add counter

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
    return meta[meta.length - 1];
};

var cloneMeta = function (meta) {
    return JSON.parse(JSON.stringify(meta));
};

module.exports = {
    list: function (itemsSchema) {
        var meta = getMeta(itemsSchema);
        return Joi.array().items(itemsSchema).meta({
            cql: "list<" + meta.cql + ">",
            method: "list",
            args: [meta.cql],
            validator: TYPE_MAP.list + "\x5C(" + meta.validator + "\x5C)",
            nestedType: meta.nestedType
        });
    },
    map: function (keyItemsSchema, valueItemsSchema) {
        var kMeta = getMeta(keyItemsSchema);
        var vMeta = getMeta(valueItemsSchema);

        return Joi.object()
            .pattern(/.*/, valueItemsSchema)
            .meta({
                cql: "map<" + kMeta.cql + ", " + vMeta.cql + ">",
                method: "map",
                args: [kMeta.cql, vMeta.cql],
                validator: TYPE_MAP.map + "\x5C(" + kMeta.validator + "," + vMeta.validator + "\x5C)",
                nestedType: vMeta.nestedType
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
        return Joi.date().allow(null).meta({
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
    timeuuid: function () {
        return Joi.string().guid().meta({
            cql: "timeuuid",
            method: "timeuuid",
            validator: TYPE_MAP.timeuuid
        });
    },
    text: function () {
        return Joi.string().allow('').allow(null).meta({
            cql: "text",
            method: "text",
            validator: TYPE_MAP.text
        });
    },
    nested: function (nestedSchema) {
        var meta = getMeta(nestedSchema);
        return nestedSchema.meta({
            args: [meta.cql],
            cql: "frozen<" + meta.cql + ">",
            method: "frozen",
            validator: TYPE_MAP.udt,
            nestedType: meta.cql
        });
    },
    frozen: function (nestedSchema) {
        var meta = getMeta(nestedSchema);
        if (meta.method === "list") {
            return nestedSchema.meta({
                method: "frozenList",
                args: [meta.cql],
                cql: "frozen<" + meta.cql + ">",
                validator: TYPE_MAP.frozen + "\x5C(" + meta.validator + "\x5C)",
                nestedType: meta.nestedType
            });
        } else {
            throw new Error("Cannot apply frozen to " + meta.method);
        }
    },
    partition_key: function (itemSchema, index) {
        index = index || 0;
        var meta = cloneMeta(getMeta(itemSchema));
        meta.partition_key = true;
        meta.component_index = index;
        return itemSchema.meta(meta);
    },
    reverse_clustering_key: function (itemSchema, index) {
        index = index || 0;
        var meta = cloneMeta(getMeta(itemSchema));
        meta.reversed_type = true;
        meta.clustering_key = true;
        meta.component_index = index;
        meta.validator = TYPE_MAP.reversed_type + "\x5C(" + meta.validator + "\x5C)";
        return itemSchema.meta(meta);
    },
    clustering_key: function (itemSchema, index) {
        index = index || 0;
        var meta = cloneMeta(getMeta(itemSchema));
        meta.clustering_key = true;
        meta.component_index = index;
        return itemSchema.meta(meta);
    },
    index: function (itemSchema, name) {
        var meta = cloneMeta(getMeta(itemSchema));
        meta.index = true;
        meta.index_name = name;
        return itemSchema.meta(meta);
    }

};

