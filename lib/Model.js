var Joi = require('joi');

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

};

Model.prototype.find = function (params) {

};

Model.prototype.validate = function (obj) {
    return Joi.assert(obj, this._schema);
};


module.exports = Model;