var IoC = require('electrolyte');
var log = IoC.create("logger").createLogger("DB_MODEL");

var Q = require('q');


module.exports = function (qb) {
    return {
        getTable: function (keyspace, table_name) {

            var cql = qb
                .select("*")
                .from("system.schema_columns")
                .where("columnfamily_name", "=", table_name)
                .andWhere("keyspace_name", "=", keyspace);

            return Q.nfcall(cql.exec)
                .then(function (result) {
                    log.info(result);
                    if (!result.rows || result.rows.length === 0)
                        return null;
                    return result.rows;
                })
                .catch(log.error.bind(log));

        }

    }
};