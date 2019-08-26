const productModel = require('../model/products');
const email = require('./mail');
const helper = require('./help');
const Schedule = require('node-schedule');

var cronPrice = {};

async function checkPrice() {
  let products = await productModel.getAllProducts();
  for (let i = 0; i < products.length; i++) {
    await timer(350);
    let isSend = await isSendEmail(products[i].link, products[i]);
    if (isSend) { 
      await handleChangedPriceEvent(products[i]);
    }
  }
}

async function isSendEmail(productID, doc) {
  try {
    let presentInfo = await productModel.search(productID);
    if (!isNeedToUpdate(doc, presentInfo.price)) {
      return false;
    }
    if (presentInfo && presentInfo.price) {
      let res = await productModel.updatePrice(doc, presentInfo.price);
      return res;
    }
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function handleChangedPriceEvent(product) {
  let users = product.users;
  users.forEach(async element => {
    await email.mailToUser(element, 'Giá thay đổi', JSON.stringify(product));
  });
}

function timer(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function isNeedToUpdate(doc, price) {
  let date = new Date().toISOString().split('T').find(e => !!e);
  let hasUpdated = false;
  doc.log.forEach(e => {
    if (e.hasOwnProperty(date)) {
      hasUpdated = true;
    }
  });
  if (hasUpdated && doc.price == helper.formatMoney(price)) {
    return false;
  }
  return true;
}

cronPrice.schedule = () => {
  Schedule.scheduleJob('*/46 * * * *', checkPrice); //1'
}

module.exports = cronPrice;