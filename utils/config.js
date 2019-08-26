const config = {
  production: {
    url: "https://c7ded7b1-4c0f-415e-ab54-b67267a69118-bluemix.cloudantnosqldb.appdomain.cloud",
    port: 443,
    auth: {
      user: "c7ded7b1-4c0f-415e-ab54-b67267a69118-bluemix",
      pass: "4745cc5bfa8d7f9f9988b9a6898bc6c04349cff1cd0c65b81701d6423c091a9b"
    },
    protocol: "https",
    host: "c7ded7b1-4c0f-415e-ab54-b67267a69118-bluemix.cloudantnosqldb.appdomain.cloud"
  },
  development: {
    url: "http://localhost",
    port: 5984,
    auth: {
      user: "admin",
      pass: "admin"
    },
    protocol: "http",
    host: "localhost"
  }
}

module.exports = config[process.env.NODE_ENV || "development"];
//module.exports = config["production" || "development"];
