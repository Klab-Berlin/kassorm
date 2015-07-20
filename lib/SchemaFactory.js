var Joi = require('joi');

module.exports = {
    createSchema: function (name) {
        return {
            keys: function (childrenKeys) {
                return Joi.object().meta({
                    cql: name,
                    mappings: ["schema"]
                }).keys(childrenKeys);
            }
        };
    }
};
