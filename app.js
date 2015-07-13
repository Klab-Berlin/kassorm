var Q = require('q');
Q.longStackSupport = true;

var IoC = require('electrolyte');

var types = require('./lib/MappingsTypes');
var SchemaFactory = require("./lib/SchemaFactory");

require('./Injections'); // pushes injections

var log = IoC.create("logger").createLogger("APP");

var addressSchema = SchemaFactory.createSchema("address")
    .keys({
        uuid: types.uuid(),
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
        xfirstname: types.partition_key(types.text(), 1),
        phones: types.map(types.text(), types.text()),
        addresses: types.map(types.text(), addressSchema)
    });

var Uuid = require('cassandra-driver').types.Uuid;
var id = Uuid.random();
log.info("id: ", id.toString());


var TestKS, PersonModel;

IoC.create("KassormConfig");
var kassorm = IoC.create("kassorm");
kassorm.createKeyspace("zzz")
    .then(function (ks) {
        log.info("1");
        TestKS = ks;
        return ks.createType("address", addressSchema);
    })
    .then(function (AddressModel) {
        return TestKS.createModel("person", schema);
    })
    .then(function (pm) {
        PersonModel = pm;
        return PersonModel.save({
            xfirstname: "wer",
            uuid: id.toString(),
            boolean: true,
            "list_of_text": ["aaa", "bbb", "ccc"],
            bigint: 9999,
            double: 222.222,
            timestamp: Date.now(),
            blob: new Buffer("ppp"),
            address: {
                uuid: id.toString(),
                street: "str",
                city: "ct"
            },
            phones: {
                "home": "098 123",
                "office": "asdsd asd"
            },
            addresses: {
                "home": {
                    uuid: id.toString(),
                    street: "str",
                    city: "ct"
                },
                "office": {
                    uuid: id.toString(),
                    street: "str",
                    city: "ct"
                }
            }

        })
    })
    .then(log.info.bind(log, "OK!"))
    .then(function () {
        PersonModel.find({uuid: id, xfirstname: "wer"}).then(function (res) {
            log.info("OUTPUT: ");
            var r = res.rows[0];
            log.info(r.address);
            log.info(r.phones);
            log.info(r.list_of_text);
            log.info(r.addresses);
        });

    })
    .then(function () {
        return TestKS.dropTable("person");
    })
    .then(function () {
        return TestKS.dropType("address");
    })
    .then(function () {
        return kassorm.dropKeyspace("zzz");
    })
    .catch(log.error.bind(log));







