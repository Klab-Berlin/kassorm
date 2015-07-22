var cassandraTypes = require('cassandra-driver').types;
var Joi = require('joi');
var Q = require("q");

var IoC = require('electrolyte');
var log = IoC.create('logger').createLogger("Model");

var Model = function (parameters) {
    this._name = parameters.name;
    this._schema = parameters.schema;
    this._joiSchema = parameters.joiSchema;
    this._queryBuilder = parameters.queryBuilder;
    this._preWriteTransform = parameters.preWriteTransform;
    log.info("MODEL READY!");
};

Model.prototype.getName = function () {
    return this._name;
};

Model.prototype.save = function (o) {
    if (this._preWriteTransform) {
        o = this._preWriteTransform(o);
    }
    o = tranformCommon(o);
    this.validate(o);
    var cql = this._queryBuilder().insert(o).into(this._name);
    return this.exec(cql).then(function (res) {
        res.insertedObject = o;
        return res;
    });
};

Model.prototype.find = function (params) {
    var cql = this._queryBuilder().select('*').from(this._name);
    var i = 0;
    Object.keys(params).forEach(function (k) {
        if (i == 0) {
            cql.where(k, "=", params[k]);
        } else {
            cql.andWhere(k, "=", params[k]);
        }
        i++;
    });
    var self = this;
    return this.exec(cql)
        .then(function (res) {
            return res.rows
                .map(mapToJs)
                .map(mapFieldNamesToJs.bind(null, self._schema))
                .map(tranformCommon);
        });
};

var mapToJs = function (obj) {
    if (obj instanceof cassandraTypes.Long) {
        return parseInt(obj.toString());
    } else if (obj instanceof cassandraTypes.Uuid) {
        return obj.toString();
    } else if (obj instanceof Date) {
        return obj.getTime();
    } else if (obj instanceof Buffer) {
        return obj;
    } else if (Array.isArray(obj)) {
        return obj.map(function (v) {
            return mapToJs(v);
        });
    } else if (obj === null) {
        return obj;
    } else if (typeof obj === "object") {
        var res = {};
        Object.keys(obj).forEach(function (k) {
            res[k] = mapToJs(obj[k]);
        });
        return res;
    } else {
        return obj;
    }
};

var mapFieldNamesToJs = function (rootSchema, obj) {

    var meta = rootSchema.meta[rootSchema.meta.length - 1];
    if (Array.isArray(obj)) {
        return obj.map(mapFieldNamesToJs.bind(null, rootSchema.items[0]));
    } else if (meta.mappings.indexOf("map") >= 0) {
        var r = {};
        Object.keys(obj).forEach(function (k) {
            r[k] = mapFieldNamesToJs(meta.vMeta, obj[k]);
        });
        return r;
    } else if (meta.mappings.indexOf("nested") >= 0 || meta.mappings.indexOf("schema") >= 0) {
        var res = {};
        Object.keys(rootSchema.children).forEach(function (schemaFieldName) {
            var field = rootSchema.children[schemaFieldName];
            //var fieldMeta = field.meta[field.meta.length - 1];
            if (obj[schemaFieldName] != null) {
                res[schemaFieldName] = mapFieldNamesToJs(field, obj[schemaFieldName]);
            } else {
                res[schemaFieldName] = null;
            }
        });
        return res;
    } else {
        return obj;
    }
};

Model.prototype.validate = function (obj) {
    Joi.assert(obj, this._joiSchema);
};

Model.prototype.exec = function (cql) {
    return Q.nbind(cql.exec, cql, {prepare: true})();
};

function tranformCommon(obj) {
    if (obj == null) {
        return null;
    }

    if (typeof obj !== "object") {
        return obj;
    }

    if (obj instanceof Buffer) {
        return obj;
    }

    return Object.keys(obj).reduce(function (acc, k) {
        var v = obj[k];
        if (Array.isArray(v)) {
            if (v.length == 0) {
                acc[k] = null;
            } else {
                acc[k] = v.map(tranformCommon);
            }
        } else {
            if (typeof v === "object") {
                acc[k] = tranformCommon(v);
            } else {
                acc[k] = v;
            }
        }
        return acc;
    }, {});
}

module.exports = Model;