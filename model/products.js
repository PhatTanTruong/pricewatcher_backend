const axios = require('axios');
const cheerio = require('cheerio');
const couchdb = require('../utils/db');

const searchModel = require('./search');
const db = 'khoaluan';
const helper = require('../utils/help');
const _ = require('lodash');

var products = {};

function ByMoneyShopee(number) {
  let value = number.toString();
  if (value.length > 5) {
    value = value.slice(0, value.toString().length - 5);
    return value.replace(/\D/g, '')
      .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
      + ' ' + 'VND';
  }
  else {
    return '';
  }
}

products.getProductShopee = (shopid, itemid) => {
  let linkAPI = "https://shopee.vn/api/v2/item/get?itemid=" + itemid +
      "&shopid=" + shopid;
  return axios.get(linkAPI).then(_res => {
    let productInfo = {
      name: _res.data.item.name,
      price: _res.data.item.price.toString().slice(0, _res.data.item.price.toString().length - 5),
      shop: "Shopee",
      image: "https://cf.shopee.vn/file/" + _res.data.item.image,
      link: linkAPI
    };
    let pricebefore = ByMoneyShopee(_res.data.item.price_before_discount);
    if (pricebefore != '') {
      productInfo.deals = ["Price before: " + pricebefore, "7 ngày miễn phí trả hàng",
        "Hàng chính hãng 100%"];
    } else {
      productInfo.deals = ["7 ngày miễn phí trả hàng", "Hàng chính hãng 100%"];
    }
    return productInfo;
  }).catch(error => {
    console.log(error);
  });
}

products.search = async (link) => {
  let productInfo = {};
  if (link.indexOf('tiki') !== -1 || link.indexOf('lazada') !== -1) {
    return axios.get(link).then(async _res => {
      let $ = await cheerio.load(_res.data);
      let shop = '';
      ['tiki', 'lazada'].forEach(element => {
        if (link.indexOf(element) != -1) shop = element;
      });
      productInfo = await searchModel.getProductInfo($, shop, link);
      return productInfo;
    }).catch(error => {
      console.log(error);
    });
  } else if (link.indexOf('shopee') !== -1) {
    link = decodeURIComponent(link.replace(/\+/g, " "));
    let info = link.slice(link.lastIndexOf('i.') + 2).split('.');
    let shopId = info[0];
    let itemId = info[1];
    productInfo = products.getProductShopee(shopId, itemId);
    return productInfo;
  } else {
    return null;
  } 
}

products.searchList = async (keyword) =>{
  let listProductInfo = {};
  let limit = 10;
  listProductInfo = await searchModel.getListProductInfo(keyword, limit);
  return listProductInfo;
}

products.updateProductsInUserInfo = async (info, email) => {
  try {
    let doc = await helper.getDocument(email);
    info.forEach(e => {
      doc.products[e.shop.toLowerCase()] = 
          helper.mergeArray(doc.products[e.shop.toLowerCase()], [helper.formatUrl(e.link)]);
    });
    return helper.updatedExistsDocument(doc);
  } catch (error) {
    console.log(error);
    return error; 
  }
}

products.deleteUserFromProduct = async (email, link) => {
  try {
    let res = await couchdb.mango(db, {
      selector:{
        _id: {
          $eq: link
        }
      }
    });
    let doc = res.data.docs.find(e => !!e);
    if (doc !== undefined){
      doc.users.splice(doc.users.indexOf(email), 1);
    }
    return couchdb.update(db, doc);
  } catch(err) {
    return err;
  }
}

products.deleteProductFromUser = async (email, link, shop) => {
  try {
    let res = await couchdb.mango(db, {
      selector:{
        _id: {
          $eq: email
        }
      }
    });
    let doc = res.data.docs.find(e => !!e);
    if (doc !== undefined) {
      for (var i in doc.products){
        if (doc.products[i].indexOf(link) != -1){
          doc.products[i].splice(doc.products[i].indexOf(link), 1);
          break;
        }
      }
    }
    return couchdb.update(db, doc);
  }catch(err){
    return err;
  }
}

products.getAllProducts = () => {
  try {
    return couchdb.mango(db, {
      selector: {
        "type": {
          $eq: "productInfo"
        }
      }
    }).then(res => {
      return res.data.docs;
    });
  } catch (error) {
    console.log(error);
    return [];
  }
}

products.getLog = async (link) => {
  try {
    return couchdb.mango(db, {
      selector:{
        _id: {
          $eq: link
        }
      }
    }).then(res => {
      let doc = res.data.docs.find(e => !! e);
      return doc.log;
    })
  } catch (error) {
    console.log(error);
    return [];
  }
}

products.updatePrice = async (doc, newPrice) => {
  try {
    newPrice = helper.formatMoney(newPrice);
    let json = {};
    let date = new Date().toISOString().split('T').find(e => !!e);
    json[date] = newPrice;
    if (doc.log[doc.log.length - 1].hasOwnProperty(date)) {
      doc.log[doc.log.length - 1][date] = newPrice;
    } else {
      doc.log.push(json);
    }
    let oldPrice = doc.price;
    doc.price = newPrice;
    if (doc.log.length > 10) {
      doc.log = doc.log.shift();
    }
    await helper.updatedExistsDocument(doc);
    if (oldPrice !== newPrice) {
      return true;
    }
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
}

products.addProducts = async (products, email) => {
  try {
    for (let i = 0; i < products.length; i++) {
      await _addProduct(products[i], email);
    }
  } catch (error) {
    console.log(error);
    return error;
  }
}

products.addProduct = (product, email) => {
  return _addProduct(product, email);
}

module.exports = products;

async function _addProduct(product, email) {
  product.link = helper.formatUrl(product.link);
  let doc = await helper.getDocument(product.link);
  if (doc) {
    if (doc.users.indexOf(email) === -1) {
      doc.users.push(email);
      return helper.updatedDocument(doc._id, doc);
    }
  } else {
    product._id = product.link;
    product.users = [email];
    product.type = "productInfo";
    product.shop = product.shop.toLowerCase();
    let date = new Date();
    product.createdAt = date.toISOString();
    date = date.toISOString().split('T').find(e => !!e);
    let json = {};
    product.price = helper.formatMoney(product.price);
    json[date] = product.price;
    product.log = [];
    product.log.push(json);
    return helper.insertDocument(product);
  }
}
