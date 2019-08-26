const couchdb = require('../utils/db');
const db = 'khoaluan';
const axios = require('axios');
const cheerio = require('cheerio');
var search = {};

search.getProductInfo = async (html, shop, link) => {
  let res = await couchdb.get(db, shop.toUpperCase());
  return getProductInfo(html, res.data, link);
}
//moji
let shopListInfo = {
  "keywordReplaceExp":" +",
  "keywordReplaceValue": "+",
  "link": "https://moji.vn/search?q=[keyword]",
  "elementContentList": ".cateProduct, .ivt",
  "contentList": [],
  "getname":{"to": ["children","1","children","1","children","0","children","0","data"], "funcs":[{"name":"toString", "args":[]}, {"name":"trim", "args":[]}], "prefix":{"template":"", "to":[]}, "postfix":{"template":"", "to":[]} },
  "getlink":{"to": ["children", "0","children","0","attribs", "href"], "funcs":[{"name":"toString", "args":[]}, {"name":"trim", "args":[]}], "prefix":{"template":"", "to":[]}, "postfix":{"template":"", "to":[]} },
  "getprice":{"to": ["children","1","children","2","children","0","data"], "funcs":[{"name":"toString", "args":[]}, {"name":"replace", "args":["\\.0+",""]}], "prefix":{"template":"", "to":[]}, "postfix":{"template":"", "to":[]} },
  "getimage":{"to": ["children","0","children","0","children","0","attribs","data-src"], "funcs":[{"name":"toString", "args":[]}, {"name":"trim", "args":[]}], "prefix":{"template":"", "to":[]}, "postfix":{"template":"", "to":[]} },
  "shopName":"Lazada"
}

search.getListProductInfo = async (keyword, limit) => {
  let listProduct = await GetProductsCrawl(shopListInfo, "moc khoa", 5);
  return [];//[...listProductShopee, ...listProductTiki, ...listProductLaza];
}

function GetProductsCrawl(shopListInfo, keyword, limit) {
  keyword = keyword.trim().replace(new RegExp(shopListInfo.keywordReplaceExp, "g"), shopListInfo.keywordReplaceValue);
  let link = shopListInfo.link.toString().replace('\[keyword\]', keyword);
  return axios.get(link).then(async res => {
    let listProduct = [];
    let numItem = 0;
    let $ = await cheerio.load(res.data);
    let list = $(shopListInfo.elementContentList);
    list = makeList(list, shopListInfo.contentList);
    let typeGet = ["getname", "getprice", "getlink", "getimage"];
    for (let i = 0; i < list.length; i++) {
      let obj = {};
      try {
        for (let type in typeGet) {
          obj[typeGet[type]] = getData(list[i], shopListInfo[typeGet[type]]);
        }
        let productInfo = {
          name: obj['getname'],
          link: obj['getlink'],
          image: obj['getimage'],
          price: obj['getprice'],
          shop: shopListInfo.shopName,
          isChoose: false
        }
        listProduct.push(productInfo);
        ++numItem;
      } catch (err) {
        continue;
      }
      if(numItem == limit){
        break;
      }
    }
    console.log("listProduct", listProduct)
    return listProduct;
  });
}

async function GetProductsAPI(shopListInfo, keyword, limit){
  keyword = keyword.replace(new RegExp(shopListInfo.keywordReplaceExp, "g"), shopListInfo.keywordReplaceValue);
  let link = shopListInfo.link.toString().replace('\[keyword\]', keyword);
  return axios.get(link).then(async res => {
    let listProduct = [];
    let items = makeList(res, shopListInfo.contentList);
    items.splice(limit);
    for (let i = 0; i < items.length; i++) {
      let keylinksearchsingle = [];
      let keylinktoproduct = [];
      for (num in shopListInfo.keylinksearchsingle.keys){
        keylinksearchsingle.push(getData(items[i], shopListInfo.keylinksearchsingle.keys[num]));
      }
      for (num in shopListInfo.keylinktoproduct.keys){
        keylinktoproduct.push(getData(items[i], shopListInfo.keylinktoproduct.keys[num]));
      }
      let links = makeLinkForAPI(singleInfo, keylinksearchsingle, keylinktoproduct);
      let productInfo = await getSingleAPI(links, singleInfo);
      console.log("product info", productInfo);
      listProduct.push(productInfo);
    }
    return listProduct;
  });
}

//Validate data theo cấu hình
function validateData(data, item, typeInfo) {
  for (num in typeInfo.funcs) {//num 0 1 2
    if (myFunc.hasOwnProperty(typeInfo.funcs[num]["name"])) {
      data = myFunc[typeInfo.funcs[num]["name"]](data, typeInfo.funcs[num]["args"]);
    }
  }
  let prefix = typeInfo.prefix.template;
  if(typeInfo.prefix.to > 0){
    for (num in  typeInfo.prefix.to){
      let replaceData = getMoreData(item, typeInfo.prefix.to[num]);
      let key = "[" + num.toString() + "]";
      prefix = prefix.replace(key, replaceData);
    }
  }
  let postfix = typeInfo.postfix.template;
  if(typeInfo.postfix.to > 0){
    for (num in  typeInfo.postfix.to){
      let replaceData = getMoreData(item, typeInfo.postfix.to[num]);
      let key = "[" + num.toString() + "]";
      postfix = postfix.replace(key, replaceData);
    }
  }
  data = prefix + data + postfix;
  return data;
}

//Danh sach ten cac ham ho tro
let myFunc = {
  "toString": function (data, arg) {
    return data.toString();
  },
  "replace": function (data, arg) {
    let str = new RegExp(arg[0].toString(), "g");
    return data.toString().replace(str, arg[1]);
  },
  "slice": function (data, arg) {
    return data.toString().slice(arg[0], arg[1]);
  },
  "trim": function (data, arg) {
    return data.toString().trim();
  },
  "split": function (data, arg) {
    data = data.split(arg[0]);
    return data[arg[1]].toString();
  }
}

//Trả về danh sách hoặc đối tượng từ các thẻ dẫn đường
function makeList(list, arrToList) {
  list = typeof (list) !== 'object' ? JSON.parse(list) : list;
  if (arrToList.length != 0) {
    for (let level in arrToList) {
      if (typeof (list[arrToList[level]]) == 'function') {
        list = list[arrToList[level]]();
        list = typeof (list) !== 'object' ? JSON.parse(list) : list;
      }
      else if (Array.isArray(list[arrToList[level]])) {
        list = list[arrToList[level]].filter(e => e.type != 'text' || e.data.trim().length != 0);
        list = typeof (list) !== 'object' ? JSON.parse(list) : list;
      }
      else {
        list = list[arrToList[level]];
        list = typeof (list) !== 'object' ? JSON.parse(list) : list;
      }
      if (Array.isArray(list)) {
        list = list.filter(e => e.type != 'text' || e.data.trim().length != 0);
        list = typeof (list) !== 'object' ? JSON.parse(list) : list;
      }
    }
    return list;
  }
  return list;
}

//Lấy 1 trường dữ liệu (type: name, price....)
function getData(item, type) {//item: chứa thông thi thô của sản phẩm, type: loại thông tin cần lấy (name, price, link, image)
  let data = item;
  for (let n in type.to) {//n = 0,1,2,3,4...
    if (typeof (data[type.to[n]]) == 'function') {
      data = data[type.to[n]]();
    }
    else if (Array.isArray(data[type.to[n]])) {
      data = data[type.to[n]].filter(e => e.type != 'text' || e.data.trim().length != 0);
    }
    else {
      data = data[type.to[n]];
    }
    if (Array.isArray(data)) {
      data = data.filter(e => e.type != 'text' || e.data.trim().length != 0);
    }
  }
  return validateData(data, item, type);//data lấy đươc, item hiện tại dùng để lấy data, type: info để lấy data
}

function getMoreData(item, to){
  let data = item;
  for (let n in to) {//n = 0,1,2,3,4...
    if (typeof (data[to[n]]) == 'function') {
      data = data[to[n]]();
    }
    else if (Array.isArray(data[to[n]])) {
      data = data[to[n]].filter(e => e.type != 'text' || e.data.trim().length != 0);
    }
    else {
      data = data[to[n]];
    }
    if (Array.isArray(data)) {
      data = data.filter(e => e.type != 'text' || e.data.trim().length != 0);
    }
  }
  return data.toString();
}//Getdata mà không cần validate (đệ quy trong hàm validate => lỗi)

//Cần hoặc link hoặc keywords để tạo link
//get 1 sản phẩm bằng api
function getSingleAPI(links, singleInfo){//link chuỗi rỗng là lấy thông tin mới, link là link đúng thì lấy thông tin lại
  return axios.get(links[0]).then(res => {
    let item = makeList(res, singleInfo.contentItem);
    let obj = {};
    let typeGet = ["getname", "getprice", "getimage"];
    for (let type in typeGet) {
      obj[typeGet[type]] = getData(item, singleInfo[typeGet[type]]);
    }
    return {
      name: obj['getname'],
      link: links[1],
      linkapi:links[0],
      image: obj['getimage'],
      price: obj['getprice'],
      shop: singleInfo.shopName,
      isChoose: false
    }
  });
}

//Tạo link tới sản phẩm và link api lấy thông tin sản phẩm (1 sản phẩm cần 2 link)
function makeLinkForAPI(singleInfo, keywordsearch, keywordtoproduct){
  let link = [];
  let linkapi = singleInfo.linksearch;
  let linkproduct = singleInfo.linkproduct;
  for (num in  keywordsearch){
    let dump = parseInt(num) + 1;
    let key = "[" + dump.toString() + "]";
    linkapi = linkapi.replace(key, keywordsearch[num]);
  }
  link.push(linkapi);
  for (num in  keywordtoproduct){
    let dump = parseInt(num) + 1;
    let key = "[" + dump.toString() + "]";
    linkproduct = linkproduct.replace(key, keywordtoproduct[num]);
  }
  link.push(linkproduct);
  return link;
}

function getProductInfo($, info, link) {
  let productInfo = {};
  productInfo = _getProductInfo($, info, link);
  return productInfo;
}

function _getProductInfo($, info, link) {
  let name = $(info.name).text().trim();
  let price = $(info.price).text().slice(0, -1).trim();
  let image = $(info.image).attr("src");
  let dealItems = [];
  info.deals.forEach(deal => {
    try {
      let dealInfo = deal.split(";");
      let dealItemTitle = dealInfo.find(e => !!e);
      for (let key in $(dealInfo[1])) {
        if (Number.parseInt(key) == key) {
          dealItem = dealItemTitle + ($(dealInfo[1]))[key].children[0].data;
          dealItems.push(dealItem);
        }
      }
    } catch (error) {
      console.log('khong the lay thong tin khuyen mai san pham');
      dealItems = [];
    }
  });

  let productInfo = {
    name: name,
    price: price,
    shop: info.shop,
    image: image,
    link: link,
    deals: dealItems
  };
  return productInfo;
}
//https://tiki.vn/search?q=
//https://balohanghieu.com/tim-kiem?q=
function getListTiki(keyword, limit) {
  let link = 'https://tiki.vn/search?q=' + keyword.replace(/ +/g, '+');
  return axios.get(link).then(async _res => {
    let listProduct = [];
    let $ = await cheerio.load(_res.data);
    let listNLI = $('.search-a-product-item');//name, link, image
    listNLI.splice(limit);
    //let test = $('.search-a-product-item .content');
    // let test = $('.item-product-loop');
    // test.splice(40);
    // let arr = ["0", "children", "1", "children", "0", "attribs", "data-src"];
    // for (let key in arr) {
    //   if (Array.isArray(test[arr[key]])) {
    //     test = test[arr[key]].filter(e => e.type != 'text' || e.data.trim().length != 0);
    //   }
    //   else {
    //     test = test[arr[key]];
    //   }
    // }
    //console.log(test);
    let listPriceFinal = $('.final-price');
    listPriceFinal.splice(limit);

    let listPriceRegular = $('.price-regular');
    listPriceRegular.splice(limit);
    for (var i = 0; i < listNLI.length; i++) {
      let productInfo = {
        name: listNLI[i].attribs.title.toString().trim(),
        link: listNLI[i].attribs.href,
        image: listNLI[i].children[1].children[1].children[1].attribs.src,
        price: listPriceFinal[i].children[0].data.toString().trim(),
        sale: listPriceRegular[i].children[0] === undefined ? "" : listPriceRegular[i].children[0].data,
        shop: 'Tiki shop',
        isChoose: false
      }
      listProduct.push(productInfo);
    }
    return listProduct;
  });
}

function getListLazada(keyword, limit) {
  let link = 'https://www.lazada.vn/catalog/?q=' + keyword.replace(/ +/g, '+');
  return axios.get(link).then(async _res => {
    let listProduct = [];
    let $ = await cheerio.load(_res.data);

    let list = $('script[type="application/ld+json"]');
    list = JSON.parse(list[1].children[0].data.toString());
    let listItem = list.itemListElement.splice(0, limit);

    for (var i = 0; i < listItem.length; i++) {
      let productInfo = {
        name: listItem[i].name.toString().trim(),
        link: listItem[i].url.toString().trim(),
        image: listItem[i].image.toString().trim(),
        price: listItem[i].offers.price.toString().replace(/\.0+/, ""),
        shop: 'Lazada',
        isChoose: false
      }
      listProduct.push(productInfo);
    }
    return listProduct;
  });
}

function makeLinkShopee(name, shopid, itemid) {
  name = name.replace(/[^a-zA-Z0-9\u00E0\u00C0\u1EA3\u1EA2\u00E3\u00C3\u00E1\u00C1\u1EA1\u1EA0\u0103\u0102\u1EB1\u1EB0\u1EB3\u1EB2\u1EB5\u1EB4\u1EAF\u1EAE\u1EB7\u1EB6\u00E2\u00C2\u1EA7\u1EA6\u1EA9\u1EA8\u1EAB\u1EAA\u1EA5\u1EA4\u1EAD\u1EAC\u0111\u0110\u00E8\u00C8\u1EBB\u1EBA\u1EBD\u1EBC\u00E9\u00C9\u1EB9\u1EB8\u00EA\u00CA\u1EC1\u1EC0\u1EC3\u1EC2\u1EC5\u1EC4\u1EBF\u1EBE\u1EC7\u1EC6\u00EC\u00CC\u1EC9\u1EC8\u0129\u0128\u00ED\u00CD\u1ECB\u1ECA\u00F2\u00D2\u1ECF\u1ECE\u00F5\u00D5\u00F3\u00D3\u1ECD\u1ECC\u00F4\u00D4\u1ED3\u1ED2\u1ED5\u1ED4\u1ED7\u1ED6\u1ED1\u1ED0\u1ED9\u1ED8\u01A1\u01A0\u1EDD\u1EDC\u1EDF\u1EDE\u1EE1\u1EE0\u1EDB\u1EDA\u1EE3\u1EE2\u00F9\u00D9\u1EE7\u1EE6\u0169\u0168\u00FA\u00DA\u1EE5\u1EE4\u01B0\u01AF\u1EEB\u1EEA\u1EED\u1EEC\u1EEF\u1EEE\u1EE9\u1EE8\u1EF1\u1EF0\u1EF3\u1EF2\u1EF7\u1EF6\u1EF9\u1EF8\u00FD\u00DD\u1EF5\u1EF4]/g, '-');
  name = name.replace(/-+/g, '-');
  let link = 'https://shopee.vn/' + name + '-i.' + shopid + '.' + itemid;
  return link;
}

function ByMoneyShopee(number) {
  let value = number.toString();
  if (value.length > 5) {
    value = value.slice(0, value.toString().length - 5);
    return value.replace(/\D/g, '')
      .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
      + ' ' + 'VND';
  }
  return '';
}

function getProductShopee(shopid, itemid) {
  let linkAPI = "https://shopee.vn/api/v2/item/get?itemid=" + itemid +
    "&shopid=" + shopid;
  return axios.get(linkAPI).then(_res => {
    console.log(_res.data.item.name, linkAPI);
    let productInfo = {
      name: _res.data.item.name,
      price: _res.data.item.price.toString().slice(0, _res.data.item.price.toString().length - 5),
      shop: "Shopee",
      image: "https://cf.shopee.vn/file/" + _res.data.item.image,
      link: makeLinkShopee(_res.data.item.name, shopid, itemid),
      isChoose: false
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

async function getListShopee(keyword, limit) {
  let apiPath = 'https://shopee.vn/api/v2/search_items/'
    + '?by=relevancy&keyword=[keyword]&limit=50&newest=0&order=desc&page_type=search';
  apiPath = apiPath.replace('[keyword]', keyword);
  let listProducts = await axios.get(apiPath).then(async res => {
    let products = [];
    let items = res.data.items;
    items.splice(limit);
    for (let i = 0; i < items.length; i++) {
      await getProductShopee(items[i].shopid, items[i].itemid).then(res => {
        products.push(res);
      });
    }
    return products;
  });
  return listProducts;
}

module.exports = search;