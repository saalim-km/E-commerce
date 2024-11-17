const orderModel = require("../models/order");
const productModel = require("../models/product");
const { findByIdAndUpdate } = require("../models/user");

const loadOrders = async(req,res)=> {
    try {
        const page = req.query.page || 1;
        const perpage = 8;
        const orders = await orderModel.find().populate('userId').skip((perpage * page)-perpage).limit(perpage).sort({createdAt : -1});
        const ordersCount = await orderModel.countDocuments();
        res.render("ordersAdmin" , {
            orders,
            currentPage : page,
            totalPages : Math.round((ordersCount / perpage)),
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).render('500');
    }
}

const loadOtderDetails = async(req,res)=> {
    try {
        const {id} = req.params;
        const order = await orderModel.findById(id).populate("products.productId").populate("shippingAddress").populate("userId");
        const products = order.products;
        const address = order.shippingAddress;
        const user = order.userId;
        res.render("orderDetail",{order , products , address , user});
    } catch (error) {
        console.log(error.message);
        res.status(500).render('500');
    }
}

const updateOrder = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (status === 'Cancelled') {
            const order = await orderModel.findById(id);
            if (order) {

                const orderUpdate = await orderModel.findByIdAndUpdate(
                    id,
                    {
                        $set: {
                            status: 'Cancelled',
                            'products.$[].status': 'Cancelled'  
                        }
                    },
                    { new: true }
                );

                if (orderUpdate) {
                    
                    for (const product of order.products) {
                        const productId = product.productId;
                        const size = product.size;
                        const quantity = product.quantity;

                        await productModel.updateOne(
                            {
                                _id: productId,
                                'sizes.size': size
                            },
                            {
                                $inc: { 'sizes.$.stock': quantity }
                            }
                        );
                    }
                    req.flash("success", "Order and products cancelled successfully.");
                    res.redirect("/admin/orders");
                }
            }
        } 
        else if(status === 'Delivered') {
            const order = await orderModel.findById(id);
            if (order) {

                const orderUpdate = await orderModel.findByIdAndUpdate(
                    id,
                    {
                        $set: {
                            status: 'Delivered',
                            'products.$[].status': 'Delivered'  
                        }
                    },
                    { new: true }
                );

                if (orderUpdate) {
                    req.flash("success", "Order and products Delivered successfully.");
                    res.redirect("/admin/orders");
                }
            }
        }
        else {
            await orderModel.findByIdAndUpdate(
                id,
                { $set: { status } }
            );
            req.flash("success", `Order status updated to ${status}`);
            res.redirect("/admin/orders");
        }
    } catch (error) {
        console.log(error.message);
        req.flash("error", `Error while updating the order`);
        res.redirect("/admin/orders");
    }
};

module.exports = {
    loadOrders,
    loadOtderDetails,
    updateOrder,
}