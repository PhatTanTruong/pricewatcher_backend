const NodeCouchDb = require("node-couchdb");
const config = require("../utils/config");

const couch = new NodeCouchDb({
  host: config.host,
  protocol: config.protocol,
  port: config.port,
  auth: config.auth
});

module.exports = couch;
