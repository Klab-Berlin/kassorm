var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;

var IoC = require('electrolyte');
var log = IoC.create("logger").createLogger("ADD_COLUMN_TEST");

require('./Injections'); // pushes injections

var Q = require("q");
var Mapper = require('../lib/kassorm').Mapper;
var JsToKnex = require("../lib/JsToKnex");

var Uuid = require('cassandra-driver').types.Uuid;
var TimeUuid = require('cassandra-driver').types.TimeUuid;

var kassorm;
var keyspaceName = "kassorm_test_ks_2";
var tableName = "alter_table_test";
var typeName = "alter_type_test";

var keyspace;
var tableCreated, typeCreated, keyspaceCreated,
    tableDropped, typeDropped, keyspaceDropped;

var typeSchemaChildren, typeSchema, tableSchemaChildren, tableSchema;
var dataInserted, dataRead;

var tableInstance, readObject;

var pkFieldChanged;


before(function (done) {
    this.timeout(5000);
    typeSchemaChildren = {
        tExt: Mapper.text(),
        boOlean: Mapper.boolean()
    };
    typeSchema = Mapper.createSchema(typeName).keys(typeSchemaChildren);

    var typeInstance0 = {
        tExt: "text0",
        boOlean: true
    };

    var typeInstance1 = {
        tExt: "text1",
        boOlean: true
    };

    tableSchemaChildren = {
        _id: Mapper.bigint(),
        uuid: Mapper.uuid(),
        timeuuid: Mapper.partition_key(Mapper.timeuuid(), 0),
        partition_key: Mapper.partition_key(Mapper.text(), 1),
        boolean: Mapper.boolean(),
        bigInt: Mapper.bigint(),
        dou_Ble: Mapper.double(),
        timestamp: Mapper.timestamp(),
        blob: Mapper.blob(),
        text_index: Mapper.index(Mapper.text()),
        nested_index: Mapper.index(Mapper.nested(typeSchema)),
        text_map: Mapper.map(Mapper.text(), Mapper.text()),
        text_list: Mapper.list(Mapper.text()),
        nESted: Mapper.nested(typeSchema),
        nested_map: Mapper.map(Mapper.text(), Mapper.nested(typeSchema)),
        nested_list: Mapper.list(Mapper.nested(typeSchema)),
        rights: Mapper.map(Mapper.text(), Mapper.boolean()),
        nullList: Mapper.list(Mapper.text()),
        nullNested: Mapper.nested(typeSchema)
    };
    tableSchema = Mapper.createSchema(tableName).keys(tableSchemaChildren);

    kassorm = IoC.create("kassorm");
    var DbModel = kassorm.getDbModel();

    keyspaceCreated = kassorm.dropKeyspace(keyspaceName)
        .then(function () {
            return kassorm.createKeyspace(keyspaceName)
        })
        .then(function (ks) {
            keyspace = ks;
        });

    typeCreated = keyspaceCreated.then(function () {
        return keyspace.createType(typeSchema);
    });

    var table;
    tableCreated = typeCreated
        .then(function () {
            return keyspace.createModel(tableSchema);
        }).then(function (t) {
            table = t;
            log.info("table:", t);
        });

    pkFieldChanged = tableCreated
        .then(function () {
            tableSchemaChildren.timeuuid = Mapper.partition_key(Mapper.timeuuid(), 1);
            tableSchemaChildren.partition_key = Mapper.partition_key(Mapper.text(), 0);
            //tableSchemaChildren.partition_key = Mapper.partition_key(Mapper.text(), 1);
            var tableSchemaExt = Mapper.createSchema(tableName).keys(tableSchemaChildren);
            return keyspace.createModel(tableSchemaExt);
        });

    pkFieldChanged.catch(log.error.bind(log));

    pkFieldChanged
        .finally(function () {
            done();
        });

});

after(function (done) {
    kassorm.dropKeyspace(keyspaceName).then(function () {
    done();
    }).catch(log.error.bind(log));
});

describe('alter PK Test Index', function () {
    this.timeout(5000);

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

    describe('Change in primary key', function () {
        it("throws error when changing partition keys index", function (done) {
            expect(pkFieldChanged).to.be.rejected.and.notify(done);
        });
    });

});
