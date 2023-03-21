var express = require("express");
var router = express.Router();
var Product = require("./../model/product");
router.get("/", function(req,res){
    res.json({"message": "this is product"});
});
router.get("/get-product-list", function(req,res){
    var productList = new Array();
    for(var i = 0; i< 20;i++){
        var product = new Product();
        product.id = (i+1);
        product.name = "name " + (i+1);
        productList.push(product);
    }
    res.json(productList);
});
module.exports = router;