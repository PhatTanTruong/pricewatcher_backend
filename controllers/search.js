const { Router } = require("express");
const productModel = require('../model/products');

const router = Router();

router.get("/:link", async (req, res, next) => {
  let link = req.params.link;
  if (link.indexOf('?') !== -1) {
    link = link.slice(0, link.indexOf('?'));
  }
  let data = await productModel.search(link);
  if (data) {
    res.json(data);
  }
  res.status(404);
});

router.get("/list/:keyword", async (req, res, next) => {
  let keyword = req.params.keyword;
  let data = await productModel.searchList(keyword);
  res.json(data);
});

module.exports = router;