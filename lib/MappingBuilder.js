// TODO: try to avoid this (Joi should work fine alone!)

var Joi = require('joi');

var Builder = function() {
    return {
        withName : function(name) {
            this.name = name;
            return this;
        },
        withKeys : function(keys) {
            this.keys = keys;
            return this;
        },
        build : function() {
            var obj = Joi.object().keys(this.keys).meta({
                cql: this.name
            });
            return obj;
        }
    };
};

module.exports = function () {
    return new Builder();
};
