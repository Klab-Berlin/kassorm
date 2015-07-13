var IoC = require('electrolyte');
require('./Injections'); // pushes injections

var log = IoC.create("logger").createLogger("APP");





var _numbers = {n1: "n1", n2: "n2"};
var addr = {city: "asd", street: "str", numbers: _numbers};
var user = {username: 'abc', birthyear: 1994, password: "ade", addr: addr};

var Joi = require('joi');



//Joi.object().keys(this.keys).meta({
//    cql: this.name
//})

var a = Joi.object().meta({name: "a"});
var b = a.meta({name: "b"});

log.info(a.describe());
log.info(b.describe());

return;


//var m1 = {"asd": "asd"};
//var m2 = {"asd": 55};

//Joi.assert(m1, m);
//Joi.assert(m2, m);

//var numbers = Joi.object().keys({
//    n1: Joi.string().meta({aaa: true}).required(),
//    n2: Joi.string()
//});

//var address_schema = Joi.object().keys({
//    city: Joi.string().required(),
//    street: Joi.string(),
//    numbers: numbers
//});


log.info(m.describe());


var sc = Joi.array().meta({bbb: 33}).meta({aaa: 22});

log.info(sc.describe());
sc.describe().meta[0].bbb = 99;
log.info(sc.describe());

return;


var schema = Joi.object().keys({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().regex(/[a-zA-Z0-9]{3,30}/),
    access_token: [Joi.string(), Joi.number()],
    birthyear: Joi.number().integer().min(1900).max(2013),
    email: Joi.string().email(),
    addr: address_schema
}).with('username', 'birthyear').without('password', 'access_token');


Joi.validate(user, schema, function (err, value) {
    if (err)
        console.error(err);
    else
        console.log(value);
});  // err === null -> valid

//
//Joi.validate(addr, address_schema, function (err, value) {
//    if (err)
//        console.error(err);
//    else
//        console.log(value);
//});  // err === null -> valid
//


var schema2 = Joi.array().items(address_schema);
var arr = [addr, addr, {city: "sad", asd: ""}];

//Joi.assert(arr, schema2);


//
//Joi.validate(arr, schema2, function (err, value) {
//    if (err)
//        console.error(err);
//    else
//        console.log(value);
//});  // err === null -> valid
