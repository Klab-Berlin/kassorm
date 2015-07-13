var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;


require('../Injections'); // pushes injections

var types = require('../lib/MappingsTypes');
var JsToKnex = require("../lib/JsToKnex");
var SchemaFactory = require("../lib/SchemaFactory");

var nestedSchemaChildren = {
    text: types.text(),
    boolean: types.boolean()
};
var nestedSchema = SchemaFactory.createSchema("nested_schema").keys(nestedSchemaChildren);

var schemaChildren = {
    uuid: types.partition_key(types.uuid(), 0),
    partition_key: types.partition_key(types.text(), 1),
    boolean: types.boolean(),
    bigint: types.bigint(),
    double: types.double(),
    timestamp: types.timestamp(),
    blob: types.blob(),
    text_index: types.index(types.text()),
    nested_index: types.index(types.nested(nestedSchema)),
    text_map: types.map(types.text(), types.text()),
    text_list: types.list(types.text()),
    nested: types.nested(nestedSchema),
    nested_map: types.map(types.text(), types.nested(nestedSchema)),
    nested_list: types.list(types.nested(nestedSchema))
};
var schema = SchemaFactory.createSchema("schema").keys(schemaChildren);







describe('Mapping Test', function () {

    var schemaKnex = JsToKnex(schema.describe());
    var nestedSchemaKnex = JsToKnex(nestedSchema.describe());

    describe('Mapping Test', function () {
        it("check schema names", function () {
            expect(schema.keys).to.have.all.keys();
            expect(nestedSchema.keys).to.have.all.keys(cqlFieldsForAddressSchema);
        });
        it("check schema children names", function () {
            expect(schema.keys).to.have.all.keys();
            expect(nestedSchema.keys).to.have.all.keys(cqlFieldsForAddressSchema);
        });
        it("check schema children types", function () {
            expect(schema.keys).to.have.all.keys();
            expect(nestedSchema.keys).to.have.all.keys(cqlFieldsForAddressSchema);
        });



    });
});
