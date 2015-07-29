var util = require('util');

var ERRORS = {};

ERRORS.PartitionKeyMismatch = function (fieldName) {
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.message = "Partition key index mismatch for " + fieldName;
};

ERRORS.PartitionKeyIndexMismatch = function (fieldName) {
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.message = "Partition key index mismatch " + fieldName;
};

ERRORS.ClusteringKeyMismatch = function (fieldName) {
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.message = "Clustering key index mismatch for " + fieldName;
};

ERRORS.ClusteringKeyIndexMismatch = function (fieldName) {
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.message = "Clustering key index mismatch " + fieldName;
};

ERRORS.ValidatorMismatch = function (fieldName, actual, expected) {
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.message = "Validator mismatch for " + fieldName + ": " + actual + "\nExpected: " + expected;
};



Object.keys(ERRORS).forEach(function (k) {
    util.inherits(ERRORS[k], Error);
});

module.exports = ERRORS;