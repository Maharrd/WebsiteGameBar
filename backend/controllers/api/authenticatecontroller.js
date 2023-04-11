var express = require("express");
var router = express.Router();
const jsonwebtoken = require("jsonwebtoken");
const jwtExpirySeconds = 300
var config = require('./../../../config/setting.json');
var verifyToken = require("./../../util/VerifyToken");
router.post("/login", (req, res) => {
    const { username, password } = req.body;
    console.log(`${username} is trying to login ..`);
  
    if (username === "admin" && password === "admin") {
      var authorities = [];

      authorities.push("admin");
      authorities.push("customer");

      var claims = [];
      claims.push("product.view");
      claims.push("product.edit");
      claims.push("product.delete");
      return res.json({
        token: jsonwebtoken.sign({ user: "admin", roles: authorities,claims: claims  }, config.jwt.secret, {expiresIn: jwtExpirySeconds}),
      });
    }
  
    return res
      .status(401)
      .json({ message: "The username and password your provided are invalid" });
  });

  router.get("/test-security",verifyToken, (req, res) => {
    console.log(req.userData);
    res.json({"status": true, "message": "login success"});
  });
  module.exports = router;