var Joi = require('joi');
var Q = require("q");

var IoC = require('electrolyte');
var log = IoC.create('logger').createLogger("Type");

var Type = function (parameters) {
    this._name = parameters.name;
    this._schema = parameters.schema;
    this._joiSchema = parameters.joiSchema;
    this._queryBuilder = parameters.queryBuilder;
    log.info("TYPE READY!");
};

Type.prototype.exec = function (cql) {
    return Q.nbind(cql.exec, cql, {prepare: true})();
};

module.exports = Type;