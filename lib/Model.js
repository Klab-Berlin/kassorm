var assert = require('assert');
var stringify = require('json-stable-stringify');

var CHECK_STORED_DATA = true;

var cassandraTypes = require('cassandra-driver').types;
var Joi = require('joi');
var Q = require("q");

var IoC = require('electrolyte');
var log = IoC.create('logger').createLogger("Model");

var Model = function (parameters) {
    this._name = parameters.name;
    this._schema = parameters.schema;
    this._joiSchema = parameters.joiSchema;
    this._queryBuilder = parameters.queryBuilder;
    this._preWriteTransform = parameters.preWriteTransform;
    //this._postReadTransform = parameters.postReadTransform;
    log.info("MODEL READY!");
};

Model.prototype.getName = function () {
    return this._name;
};

Model.prototype.save = function (o) {
    if (this._preWriteTransform) {
        o = this._preWriteTransform(o);
    }
    o = this.validate(o);
    o = tranformCommon(o);
    o = addUnderscore(o);

    var cql = this._queryBuilder().insert(o).into(this._name);
    var res = this.exec(cql).then(function (r) {
        o = removeUnderscore(o);
        r.insertedObject = o;
        return r;
    });

    if (CHECK_STORED_DATA) {
        var self = this;
        var queryResponse;
        return res
            .then(function (response) {
                queryResponse = response;
                return self.find({timeuuid: o.timeuuid});
            })
            .then(function (v) {
                assert.equal(stringify(tranformCommon(v[0])), stringify(tranformCommon(o)));
                return queryResponse;
            })
            .catch(function (e) {
                if (e instanceof assert.AssertionError) {
                    log.info(stringify(e.actual));
                    log.info(stringify(e.expected));
                }
                throw e;
            });
    }

    return res;
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
    return this.exec(cql)
        .then(function (res) {
            return res.rows
                .map(mapToJs)
                .map(removeUnderscore)
                .map(tranformCommon);
        });
};

var mapToJs = function (obj) {
    if (obj instanceof cassandraTypes.Long) {
        return parseInt(obj.toString());
    } else if (obj instanceof cassandraTypes.Uuid) {
        return obj.toString();
    } else if (obj instanceof Date) {
        return obj.getTime();
    } else if (obj instanceof Buffer) {
        return obj;
    } else if (Array.isArray(obj)) {
        return obj.map(function (v) {
            return mapToJs(v);
        });
    } else if (obj === null) {
        return obj;
    } else if (typeof obj === "object") {
        var res = {};
        Object.keys(obj).forEach(function (k) {
            res[k] = mapToJs(obj[k]);
        });
        return res;
    } else {
        return obj;
    }
};

Model.prototype.validate = function (obj) {
    var validation = Joi.validate(obj, this._joiSchema, {stripUnknown: true});
    if (validation.error) {
        throw validation.error;
    }
    return validation.value;
};

Model.prototype.exec = function (cql) {
    return Q.nbind(cql.exec, cql, {prepare: true})();
};

function tranformCommon(obj) {
    if (obj == null) {
        return null;
    }

    if (obj === "") {
        return null;
    }

    // NaN test
    // https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/isNaN#Verwirrende_Spezialf.C3.A4lle
    if (obj != obj) {
        return null;
    }

    if (typeof obj !== "object") {
        return obj;
    }

    if (obj instanceof Buffer) {
        return obj;
    }

    if (obj instanceof Date) {
        return obj.getTime();
    }

    return Object.keys(obj).reduce(function (acc, k) {
        var v = obj[k];
        if (v === null) {
            // key deleted
        } else if (Array.isArray(v)) {
            if (v.length == 0) {
                // key deleted
            } else {
                acc[k] = v.map(tranformCommon);
            }
        } else {
            acc[k] = tranformCommon(v);
        }
        return acc;
    }, {});
}

function addUnderscore(obj) {
    if (obj === null) {
        return null;
    }
    if (obj instanceof Buffer) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(function (v) {
            return addUnderscore(v);
        });
    }
    if (typeof obj === "object") {
        return Object.keys(obj).reduce(function (acc, k) {
            var key = k;
            if (key[0] == "_") {
                key = "underscore" + key;
            }
            acc[key] = addUnderscore(obj[k]);
            return acc;
        }, {});
    }
    return obj;
}

function removeUnderscore(obj) {
    if (obj === null) {
        return null;
    }
    if (obj instanceof Buffer) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(function (v) {
            return removeUnderscore(v);
        });
    }
    if (typeof obj === "object") {
        return Object.keys(obj).reduce(function (acc, k) {
            var key = k.replace("underscore", "");
            acc[key] = removeUnderscore(obj[k]);
            return acc;
        }, {});
    }
    return obj;
}

module.exports = Model;