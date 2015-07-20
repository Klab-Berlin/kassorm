var cassandraTypes = require('cassandra-driver').types;
var Joi = require('joi');
var Q = require("q");
var humps = require("humps");

var IoC = require('electrolyte');
var log = IoC.create('logger').createLogger("Model");

var Model = function (parameters) {
    this._name = parameters.name;
    this._schema = parameters.schema;
    this._joiSchema = parameters.joiSchema;
    this._queryBuilder = parameters.queryBuilder;
    log.info("MODEL READY!");
};

function decamelizeKeys(obj) {
    if (obj === null) {
        return null;
    }
    if (obj instanceof Buffer) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(function (v) {
            return decamelizeKeys(v);
        });
    }
    if (typeof obj === "object") {
        var res = {};
        Object.keys(obj).forEach(function (k) {
            res[humps.decamelize(k)] = decamelizeKeys(obj[k]);
        });
        return res;
    }
    return obj;
}

Model.prototype.save = function (o) {
    this.validate(o);
    var obj = decamelizeKeys(o);
    var cql = this._queryBuilder().insert(obj).into(this._name);
    return this.exec(cql);
};

Model.prototype.find = function (par) {
    var params = humps.decamelizeKeys(par);
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
            return res.rows.map(mapToJs);
        })
        .then(function (res) {
            return res.map(mapFieldNamesToJs.bind(null, self._schema));
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
        log.info("map");
        // TODO: implement support for complex types (map<text,UDT>)
        return obj;
    } else if (meta.mappings.indexOf("nested") >= 0 || meta.mappings.indexOf("schema") >= 0) {
        var res = {};
        Object.keys(rootSchema.children).forEach(function (schemaFieldName) {
            var field = rootSchema.children[schemaFieldName];
            //var fieldMeta = field.meta[field.meta.length - 1];
            var dbFieldName = humps.decamelize(schemaFieldName);
            res[schemaFieldName] = mapFieldNamesToJs(field, obj[dbFieldName]);
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

module.exports = Model;