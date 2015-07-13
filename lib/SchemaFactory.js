var Joi = require('joi');

module.exports = {
    createSchema: function (name) {
        return Joi.object().meta({
            cql: name
        });
    }
};
