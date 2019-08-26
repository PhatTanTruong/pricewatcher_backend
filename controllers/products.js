const { Router } = require("express");
const productModel = require('../model/products');
const email = require('../utils/mail');

const router = Router();

router.post('/deleteProduct', async(req, res, next) => {
  let data = req.body.data;
  try{
    if(data){
      await productModel.deleteProductFromUser(data.email, data.link);
      await productModel.deleteUserFromProduct(data.email, data.link);
      
      res.json({status: 'ok'});
    }
  }catch(err){
    console.log(err);
  }
});

router.post('/getLog', async (req, res, next) => {
  let link = req.body.link;
  let data = await productModel.getLog(link);
  res.json(data);
})

router.post("/addMultiProducts", async (req, res, next) => {
  let data = req.body.data;
  try {
    if (data) {
      await productModel.updateProductsInUserInfo(data.info, data.email);
      await productModel.addProducts(data.info, data.email);
      let products = '';
      data.info.forEach(element => {
        products += `${element.name} <br>`
      });
      email.mailToUser(data.email, 
        'Đăng ký theo dõi giá thành công',
        `Chào ${data.email}, bạn đã đăng ký theo dõi giá sản phẩm <br> 
        ${products}
        Chúng tôi sẽ email đến bạn khi có sự biến đổi giá của sản phẩm. <br>
        Cám ơn đã sử dụng dịch vụ của chúng tôi! <br>
        Đây là email tự động xin đừng trả lời email này!`)
      res.json({ "status": 201 });
    } else {
      res.json({ "status": 500 });
    }
  } catch (error) {
    res.json(error);
  }
});

module.exports = router;