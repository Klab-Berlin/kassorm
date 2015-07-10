var IoC = require('electrolyte');

var types = require('./lib/MappingsTypes');
var MappingBuilder = require("./lib/MappingBuilder");

require('./Injections'); // pushes injections

var log = IoC.create("logger").createLogger("APP");

log.info("hello");


var addressSchema = MappingBuilder()
    .withName("address")
    .withKeys({
        uuid: types.uuid(),
        street: types.text(),
        city: types.text()
    })
    .build();

var schema = MappingBuilder()
    .withName("schema")
    .withKeys({
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
        addresses: types.map(types.text(), types.nested(addressSchema))
    })
    .build();


IoC.create("KassormConfig");
var kassorm = IoC.create("kassorm");
var TestKS = kassorm.createKeyspace("zzz");

var AddressModel = TestKS.createType("address47", addressSchema);
AddressModel.isReady()
    .then(function () {
        var PersonModel = TestKS.createModel("person3", schema);
        var Uuid = require('cassandra-driver').types.Uuid;
        var id = Uuid.random();
        log.info("id: ", id.toString());

        PersonModel.save({
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

        }).then(log.info.bind(log, "OK!")).catch(log.error.bind(log))

            .then(function () {
                PersonModel.find({uuid: id, xfirstname: "wer"}).then(function (res) {
                    log.info("OUTPUT: ");
                    var r = res.rows[0];
                    log.info(r.address);
                    log.info(r.phones);
                    log.info(r.list_of_text);
                    log.info(r.addresses);
                });

            });


    })
    .catch(log.error.bind(log));

