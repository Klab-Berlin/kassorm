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
    var obj = decamelizeKeys(o);
    this.validate(obj);
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