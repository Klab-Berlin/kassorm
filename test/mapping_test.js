var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;

var IoC = require('electrolyte');
var log = IoC.create("logger").createLogger("TEST");

var Q = require("q");
var Promise = Q.Promise;

require('./Injections'); // pushes injections

var types = require('../lib/MappingsTypes');
var JsToKnex = require("../lib/JsToKnex");
var SchemaFactory = require("../lib/SchemaFactory");

var Uuid = require('cassandra-driver').types.Uuid;
var TimeUuid = require('cassandra-driver').types.TimeUuid;

var kassorm;
var keyspaceName = "kassorm_test_ks";
var tableName = "kassorm_table";
var typeName = "kassorm_type";

var tableCreated, typeCreated, keyspaceCreated,
    tableDropped, typeDropped, keyspaceDropped;

var typeSchemaChildren, typeSchema, tableSchemaChildren, tableSchema;

var dataInserted, dataRead;

var tableInstance, readObject;


before(function (done) {
    typeSchemaChildren = {
        tExt: types.text(),
        boOlean: types.boolean()
    };
    typeSchema = SchemaFactory.createSchema("kassormType").keys(typeSchemaChildren);

    var typeInstance0 = {
        tExt: "text0",
        boOlean: true
    };

    var typeInstance1 = {
        tExt: "text1",
        boOlean: true
    };

    tableSchemaChildren = {
        _id: types.bigint(),
        uuid: types.partition_key(types.uuid(), 0),
        timeUuid: types.timeuuid(),
        partition_key: types.partition_key(types.text(), 1),
        boolean: types.boolean(),
        bigInt: types.bigint(),
        dou_Ble: types.double(),
        timestamp: types.timestamp(),
        blob: types.blob(),
        text_index: types.index(types.text()),
        nested_index: types.index(types.nested(typeSchema)),
        text_map: types.map(types.text(), types.text()),
        text_list: types.list(types.text()),
        nESted: types.nested(typeSchema),
        nested_map: types.map(types.text(), types.nested(typeSchema)),
        nested_list: types.list(types.nested(typeSchema)),
        rights: types.map(types.text(), types.boolean())
    };
    tableSchema = SchemaFactory.createSchema("kassorm_table").keys(tableSchemaChildren);

    var tableInstanceId = Uuid.random().toString();

    tableInstance = {
        _id: 22,
        uuid: tableInstanceId,
        timeUuid: TimeUuid.now().toString(),
        partition_key: "partition_key",
        boolean: true,
        bigInt: 9999,
        dou_Ble: 99.99,
        timestamp: Date.now(),
        blob: new Buffer("blob"),
        text_index: "text_index",
        nested_index: typeInstance0,
        text_map: {"text_map_key": "text_map_value"},
        text_list: ["text_list_0", "text_list_1"],
        nESted: typeInstance0,
        nested_map: {"nested_map_key": typeInstance0},
        nested_list: [typeInstance0, typeInstance1],
        rights: {"addUser": true, "admin": true, "api": true, "use": true}
    };

    kassorm = IoC.create("kassorm");

    var keyspace;
    keyspaceCreated = kassorm.dropKeyspace(keyspaceName).then(function () {
        return kassorm.createKeyspace(keyspaceName)
            .then(function (ks) {
                keyspace = ks;
            });
    });

    typeCreated = keyspaceCreated.then(function () {
        return keyspace.createType(typeSchema);
    });

    var table;
    tableCreated = typeCreated
        .then(function () {
            return keyspace.createModel(tableSchema);
        })
        .then(function (t) {
            table = t;
        });

    dataInserted = tableCreated.then(function () {
        return table.save(tableInstance);
    });

    dataRead = dataInserted.then(function () {
        return table.find({"uuid": tableInstanceId, "partition_key": "partition_key"});
    }).then(function (rows) {
        readObject = rows[0];
    }).catch(log.error.bind(log));

    var canDropEverything = dataRead;
    tableDropped = canDropEverything.then(function () {
        return keyspace.dropTable(tableName);
    });

    typeDropped = tableDropped.then(function () {
        return keyspace.dropType(typeName);
    });

    keyspaceDropped = typeDropped.then(function () {
        return kassorm.dropKeyspace(keyspaceName);
    });

    done();
});


describe('Mapping Test', function () {
    this.timeout(500000);

    describe('Create keyspaces, tables and types', function () {

        it("creates Keyspace", function (done) {
            expect(keyspaceCreated).to.be.fulfilled.and.notify(done);
        });

        it("creates Table", function (done) {
            expect(tableCreated).to.be.fulfilled.and.notify(done);
        });

        it("creates Type", function (done) {
            expect(typeCreated).to.be.fulfilled.and.notify(done);
        });
    });

    describe('Drop keyspaces, tables and types', function () {

        it("drops Keyspace", function (done) {
            expect(keyspaceDropped).to.be.fulfilled.and.notify(done);
        });

        it("drops Table", function (done) {
            expect(tableDropped).to.be.fulfilled.and.notify(done);
        });

        it("drops Type", function (done) {
            expect(typeDropped).to.be.fulfilled.and.notify(done);
        });
    });

    describe('Insert and read data', function () {

        it("inserts data", function (done) {
            expect(dataInserted).to.be.fulfilled.and.notify(done);
        });

        it("read Table", function (done) {
            expect(dataRead).to.be.fulfilled.and.notify(done);
        });

        it("data stored equals data retrieved", function () {
            expect(readObject).to.be.eql(tableInstance);
        });
    });


    describe('Mapping Test', function () {

        it("fields names", function () {
            var tableSchemaKnex = JsToKnex(tableSchema.describe());
            var typeSchemaKnex = JsToKnex(typeSchema.describe());

            expect(tableSchemaKnex.children).to.have.all.keys(Object.keys(tableSchemaChildren));
            expect(typeSchemaKnex.children).to.have.all.keys(Object.keys(typeSchemaChildren));
        });
    });

});


