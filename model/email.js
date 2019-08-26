const couchdb = require('../utils/db');
const db = 'khoaluan';
var email = {};

email.getLinks = async () => {
  let arr = [];
  let res = await couchdb.mango(db, {
    selector: {
      type: {
        $eq: "user"
      }
    }
  });
  res.data.docs.forEach(e => {
    arr.push(e.products);
  });
  return arr;
}

module.exports = email;