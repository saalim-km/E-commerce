const orderModel = require("../models/order");
const { findByIdAndUpdate } = require("../models/user");

const loadOrders = async(req,res)=> {
    try {
        const orders = await orderModel.find().populate('userId');
        res.render("ordersAdmin" , {orders});
    } catch (error) {
        console.log("error while loading orders page")
    }
}

const loadOtderDetails = async(req,res)=> {
    try {
        const {id} = req.params;
        const order = await orderModel.findById(id).populate("products.productId").populate("shippingAddress").populate("userId");
        const products = order.products;
        const address = order.shippingAddress;
        const user = order.userId;
        console.log(products);
        res.render("orderDetail",{order , products , address , user});
    } catch (error) {
        console.log("error while loading the order details page : ",error.message);
    }
}

const updateOrder = async(req,res)=> {
    try {
        const {status} = req.body;
        const {id} = req.params;
        const order = await orderModel.findByIdAndUpdate(id,{$set : {status : status}});
        req.flash(`success","order status update to ${status}`);
        res.redirect("/admin/orders");
    } catch (error) {
        req.flash("error",`error while updating the cart ${error.message}`);
        console.log("error while updating order",error.message);
    }
}
module.exports = {
    loadOrders,
    loadOtderDetails,
    updateOrder,
}