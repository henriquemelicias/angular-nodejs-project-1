const controller = require("../controllers/authController");

module.exports = function(app) {
  app.post("/auth/signup", controller.signup);
  app.post("/auth/signin", controller.signin);
};
