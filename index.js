const express = require("express");
const app = express();

const bodyParser = require('body-parser'); 

const account = require('./controllers/account');
const search = require('./controllers/search');
const products = require('./controllers/products');
const auth = require('./utils/auth');

const PORT = 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.listen(PORT, () => {
  console.log(`app listen on port ${PORT}`);
});

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, apiKey"
  );

  if ("OPTIONS" == req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(function(req, res, next) {
  try {
    if (req.url === "/account/login" || 
      req.url === "/account/register" ||
      req.url === "/account/loginByGoogle" ||
      req.url === "/"
    ) {
      next();
    } else {
      if (auth.isValidUser(req.headers.apikey)) {
        next();
      } else {
        res.status(401).json({ 'message': 'unauthentication' });
      }
    }
  } catch (error) {
    next(error);
  }
});

app.use('/account', account);
app.use('/search', search);
app.use('/products', products);

app.get('/', (req, res) => {
  res.status(200).json({status: 200});
});

// const cron = require('./utils/cronPrice');
// cron.schedule();