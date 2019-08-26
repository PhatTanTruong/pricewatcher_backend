const auth = require('../utils/auth');
const { Router } = require("express");
const accountModel = require('../model/account');

const router = Router();

// Add POST - /api/accounts/login
router.post("/login", async (req, res, next) => {
  try {
    let isLogSuccess = await accountModel.login(req.body.email, req.body.password);
    if (isLogSuccess == true) {
      let jwt = auth.setUser({ username: req.body.email, date: new Date() });
      return res.status(200).json({ jwt: jwt });  
    } else {
      res.status(401).json({ message: "Bad credentials" });
    }    
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: "Bad credentials" });
  }
});

router.post("/loginByGoogle", async (req, res, next) => {
  try {
    await accountModel.loginByGoogle(req.body.data.email);
    res.status(200);
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: "Bad credentials" });
  }
});

// Add POST - /api/accounts/register
router.post('/register', async (req, res, next) => {
  try {
    let result = await accountModel.register(req.body.email, req.body.password);
    await accountModel.createNewUser(req.body.email);
    res.status(201).json({ message: 'register success' });
  } catch (error) {
    res.status(401).json({ message: 'conflict' });
  }
});

// Export the server middleware
module.exports = router;