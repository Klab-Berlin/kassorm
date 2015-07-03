var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;


require('../Injections'); // pushes injections

var types = require('../lib/MappingsTypes');
var JsToKnex = require("../lib/JsToKnex");
var MappingBuilder = require("../lib/MappingBuilder");

var nestedSchema = MappingBuilder()
    .withName("nested_schema")
    .withKeys({
        uuid: types.primary(types.uuid()),
        boolean: types.boolean(),
        "list": types.list(types.text()),
        bigint: types.bigint(),
        double: types.double(),
        timestamp: types.timestamp(),
        blob: types.blob()
    })
    .build();

var schema = MappingBuilder()
    .withName("schema")
    .withKeys({
        uuid: types.primary(types.uuid()),
        boolean: types.boolean(),
        "list": types.list(types.text()),
        bigint: types.bigint(),
        double: types.double(),
        timestamp: types.timestamp(),
        blob: types.blob()
        //,
        //"frozen<nested_schema>": types.nested(nestedSchema)
    })
    .build();


var cqlFieldsForSchema = Object.keys(schema.keys).map(function (k) {
    return JsToKnex(schema.keys[k]).method;
});

var cqlFieldsForNestedSchema = Object.keys(nestedSchema.keys).map(function (k) {
    return JsToKnex(nestedSchema.keys[k]).method;
});

describe('Mapping Test', function () {
    describe('conversion test', function () {
        it("should map", function () {
            expect(schema.keys).to.have.all.keys(cqlFieldsForSchema);
            expect(nestedSchema.keys).to.have.all.keys(cqlFieldsForNestedSchema);
        });

    });
});
