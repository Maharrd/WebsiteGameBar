var express = require("express");
var router = express.Router();
// router.use("/home", require(__dirname + "/homecontroller"));
// router.use("/product", require(__dirname + "/productcontroller"));
router.get("/", function(req,res){
    // res.json({"message": "this is index page"});
   res.render("index")
});
router.get("/services", function(req,res){
    
    res.render("services");
});
router.get("/products", function(req,res){
    
    res.render("products");
});
router.get("/about", function(req,res){
    
    res.render("about");
});
router.get("/contact", function(req,res){
    
    res.render("contact");
});
router.get("/index", function(req,res){
    
   res.render("index")
});
module.exports = router;
