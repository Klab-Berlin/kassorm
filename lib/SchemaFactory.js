var humps = require("humps");
var Joi = require('joi');

module.exports = {
    createSchema: function (n) {
        return {
            keys: function (childrenKeys) {
                var name = humps.decamelize(n);
                var childrenKeysDecamelized = {};
                Object.keys(childrenKeys).forEach(function (k) {
                    childrenKeysDecamelized[humps.decamelize(k)] = childrenKeys[k];
                });
                return Joi.object().meta({
                    cql: name
                }).keys(childrenKeysDecamelized);
            }
        };
    }
};
