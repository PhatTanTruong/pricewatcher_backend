var couchdb = require("../utils/db");

var account = {};

const db = "khoaluan";
const helper = require("../utils/help");
const sha256 = require("sha256");

account.register = (email, password) => {
  let doc = {
    _id: "org.couchdb.user:" + email,
    name: email,
    roles: ["0"],
    metadata: {
      database: db
    },
    type: "user",
    iterations: 10,
    password: password,
    pass: sha256(password)
  };
  return couchdb.insert("_users", doc);
};

account.createNewUser = async email => {
  const doc = {
    _id: email,
    type: "user",
    products: {}
  };
  try {
    await couchdb.insert(db, doc);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

account.checkExistsUser = async email => {
  let res = await couchdb.mango(db, {
    selector: {
      _id: {
        $eq: email
      }
    }
  });
  res = res.data.docs.find(e => !!e);
  if (res) return true;
  return false;
};

account.loginByGoogle = async email => {
  let isExistsAccount = await account.checkExistsUser(email);
  if (!isExistsAccount) {
    await account.createNewUser(email);
  }
};

account.login = async (email, pass) => {
  try {
    return helper.getUser(email).then(res => {
      if (res.pass === sha256(pass)) {
        return true;
      }
      return false;
    });
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = account;
