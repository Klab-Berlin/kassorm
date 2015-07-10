var Joi = require('joi');
var Q = require("q");

var IoC = require('electrolyte');
var log = IoC.create('logger').createLogger("Type");

var Type = function (parameters) {
    this._name = parameters.name;
    this._schema = parameters.schema;
    this._joiSchema = parameters.joiSchema;
    this._queryBuilder = parameters.queryBuilder;
    this._ready = parameters.ready;
    this._ready.then(log.info.bind(log, "TYPE READY!")).catch(log.error.bind(log));
};

Type.prototype.isReady = function () {
    return this._ready;
};

Type.prototype.exec = function (cql) {
    return this._ready.then(function () {
        return Q.nbind(cql.exec, cql, {prepare: true})();
    });
};

module.exports = Type;