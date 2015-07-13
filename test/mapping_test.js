var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;


require('../Injections'); // pushes injections

var types = require('../lib/MappingsTypes');
var JsToKnex = require("../lib/JsToKnex");
var SchemaFactory = require("../lib/SchemaFactory");


var addressSchema = SchemaFactory.createSchema("address")
    .keys({
        street: types.text(),
        city: types.text()
    });

var schema = SchemaFactory.createSchema("schema")
    .keys({
        uuid: types.partition_key(types.uuid(), 0),
        boolean: types.boolean(),
        "list_of_text": types.list(types.text()),
        bigint: types.bigint(),
        double: types.index(types.double()),
        timestamp: types.timestamp(),
        blob: types.blob(),
        address: types.nested(addressSchema),
        firstname: types.partition_key(types.text(), 1),
        phones: types.map(types.text(), types.text()),
        //addresses: types.map(types.text(), addressSchema)
    });



var cqlFieldsForSchema = JsToKnex(schema);
console.log(cqlFieldsForSchema);

var childrenAddressSchema = JsToKnex(addressSchema);
console.log(childrenAddressSchema);

describe('Mapping Test', function () {
    describe('conversion test', function () {
        it("should map", function () {
            expect(schema.keys).to.have.all.keys(cqlFieldsForSchema);
            expect(nestedSchema.keys).to.have.all.keys(cqlFieldsForAddressSchema);
        });

    });
});
