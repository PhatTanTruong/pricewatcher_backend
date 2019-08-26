const couchdb = require('./db');
const dbName = 'khoaluan';
const _ = require('lodash');

var helper = {};

helper.updatedDocument = async (_id, newDoc) => {
  try {
    let doc = await helper.getDocument(_id);
    if (doc) {
      newDoc._id = doc._id;
      newDoc._rev = doc._rev;
      return couchdb.update(dbName, newDoc).then(res => {
        return res.status;
      });
    } else {
      console.log('...err');
    }
  } catch (error) {
    console.log(error);
  }
}

helper.updatedExistsDocument = async (doc) => {
  try {
    doc.updatedAt = new Date().toISOString();
    return couchdb.update(dbName, doc).then(res => {
      return res.status;
    });
  } catch (error) {
    console.log(error);
  }
}

helper.getDocument = async (_id) => {
  try {
    let doc = await couchdb.mango(dbName, {
      selector: {
        _id: {
          $eq: _id
        }
      }
    }).then(res => res.data.docs.find(e => !!e));
    return doc;
  } catch (error) {
    console.log(error);
  }
}

helper.getUser = async (email) => {
  try {
    let doc = await couchdb.mango("_users", {
      selector: {
        _id: {
          $eq: `org.couchdb.user:${email}`
        }
      }
    }).then(res => res.data.docs.find(e => !!e));
    return doc;
  } catch (error) {
    console.log(error);
  }
}

helper.insertDocument = (doc) => {
  try {
    return couchdb.insert(dbName, doc);
  } catch (error) {
    console.log(error);
  }
}

helper.mergeArray = (arr1, arr2) => {
  let arr = undefined;
  if (Array.isArray(arr1)) {
    arr = [...arr1, ...arr2];
  } else {
    arr1 = [];
    arr = [...arr1, ...arr2];
  }
  arr = _.uniq(arr);
  return arr;
}

helper.formatMoney = (money) => {
  let str = '';
  for (let i = 0; i < money.length; i++) {
    if (!isNaN(Number.parseInt(money[i]))) {
      str += money[i];
    }
  }
  return str;
}

helper.formatUrl = (url) => {
  if (url.indexOf('?') > -1) {
    url = url.split('?').find(e => !!e);
  }
  return url;
}

helper.getDocumentsByView = (dbName, viewUrl, options) => {
  return couch.get(dbName, viewUrl, options)
  .then(({data, headers, status}) => {
    return data;
  }, err => {
    console.log(err);
    return [];
  });
}

module.exports = helper;