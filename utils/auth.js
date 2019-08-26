const jwt = require("jwt-simple");
const axios = require('axios');

var secret = 'khoaluanjwt';

var auth = {};

auth.setUser = function (user) {
  var apikey = jwt.encode(user, secret);
  return apikey;
};

auth.isValidUser = async function (token) {
  if (!token) return;
  let res = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`)
  .then(async user => {
    return user.email_verified;
  }).catch(err => {
    return false;
  });
  if (res) {
    return res;
  } else {
    try {
      let user = jwt.decode(token, secret);
      if (user.username && user.roles && user.date) {
        return true;
      } 
    } catch (error) {
      return false;
    }
  }
  return false;
};

module.exports = auth;
