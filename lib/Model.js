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
    return this.exec(cql);
};

Model.prototype.validate = function (obj) {
    Joi.assert(obj, this._joiSchema);
};

Model.prototype.exec = function (cql) {
    return Q.nbind(cql.exec, cql, {prepare: true})();
};

module.exports = Model;