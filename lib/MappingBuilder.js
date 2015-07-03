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
            var obj = Joi.object().keys(this.keys);
            obj.knex = {
                cql: this.name
            };
            obj.keys = this.keys;
            return obj;
        }
    };
};

module.exports = function () {
    return new Builder();
};
