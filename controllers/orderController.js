const orderModel = require("../models/order");
const productModel = require("../models/product");
const { findByIdAndUpdate } = require("../models/user");

const loadOrders = async(req,res)=> {
    try {
        const page = req.query.page || 1;
        const perpage = 3;
        const orders = await orderModel.find().populate('userId').skip((perpage * page)-perpage).limit(perpage).sort({createdAt : -1});
        const ordersCount = await orderModel.countDocuments();
        res.render("ordersAdmin" , {
            orders,
            currentPage : page,
            totalPages : (ordersCount / perpage),
        });
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
        if(status == 'Cancelled') {
            const order = await orderModel.findById(id);
            const orderUpdate = await orderModel.findByIdAndUpdate(id,{$set : {status : 'Cancelled'}});
            if(orderUpdate) {
                for(const product of order.products) {
                    const productId = product.productId;
                    const size = product.size;
                    const quantity = product.quantity

                    await productModel.updateOne(
                        {
                            _id : productId,
                            'sizes.size' : size,
                        },
                        {
                            $inc : {'sizes.$.stock' : quantity}
                        }
                    );
                }
                res.redirect("/admin/orders");
            }
        }else {
            const order = await orderModel.findByIdAndUpdate(id,{$set : {status : status}});
            req.flash(`success","order status update to ${status}`);
            res.redirect("/admin/orders");
        }
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