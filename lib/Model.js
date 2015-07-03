var Joi = require('joi');
var Q = require("q");

var IoC = require('electrolyte');
var log = IoC.create('logger').createLogger("Model");

var Model = function (parameters) {
    this._name = parameters.name;
    this._schema = parameters.schema;
    this._queryBuilder = parameters.queryBuilder;
    this._ready = parameters.ready;
    this._ready.then(log.info.bind(log, "MODEL READY!")).catch(log.error.bind(log));
};

Model.prototype.save = function (obj) {
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
    return this.exec(cql);
};

Model.prototype.validate = function (obj) {
    return Joi.assert(obj, this._schema);
};

Model.prototype.exec = function (cql) {
    return this._ready.then(function () {
        return Q.nbind(cql.exec, cql, {prepare: true})();
    });
};

module.exports = Model;