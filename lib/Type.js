var Joi = require('joi');
var Q = require("q");

var IoC = require('electrolyte');
var log = IoC.create('logger').createLogger("Type");

var Type = function (parameters) {
    this._name = parameters.name;
    this._schema = parameters.schema;
    this._queryBuilder = parameters.queryBuilder;
    this._ready = parameters.ready;
    this._ready.then(log.info.bind(log, "TYPE READY!")).catch(log.error.bind(log));
};

Type.prototype.isReady = function () {
    return this._ready;
};

Type.prototype.save = function (obj) {
    var cql = this._queryBuilder().insert(obj).into(this._name);
    return this.exec(cql);
};

Type.prototype.find = function (params) {
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
    return this.exec(cql);
};

Type.prototype.validate = function (obj) {
    return Joi.assert(obj, this._schema);
};

Type.prototype.exec = function (cql) {
    return this._ready.then(function () {
        return Q.nbind(cql.exec, cql, {prepare: true})();
    });
};

module.exports = Type;