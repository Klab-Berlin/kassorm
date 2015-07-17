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
    log.info("MODEL READY!");
};

Model.prototype.save = function (obj) {
    this.validate(obj);
    var cql = this._queryBuilder().insert(obj).into(this._name);
    return this.exec(cql);
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
    return this.exec(cql).then(function (res) {
        return res.rows.map(mapToJs);
    });
};

var mapToJs = function (obj) {
    if (obj instanceof cassandraTypes.Long) {
        return obj.toInt();
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

Model.prototype.validate = function (obj) {
    Joi.assert(obj, this._joiSchema);
};

Model.prototype.exec = function (cql) {
    return Q.nbind(cql.exec, cql, {prepare: true})();
};

module.exports = Model;