const Order = require('../models/order');
const Product = require('../models/product');
const cartModel = require('../models/cart');
const User = require('../models/user');
const Razorpay = require("razorpay");
const { ObjectId } = require("mongoose").Types;

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

// For Failed payments
const order_repayment = async(req,res)=> {
    try {
        const {orderId} = req.body;
        const order = await Order.findById(orderId)

        const amount = order.totalAmount * 100;
        const options = {
            amount: amount,
            currency: "INR",
            receipt: "razorUser@gmail.com",
        };

        razorpayInstance.orders.create(options, (err, order) => {
        if (!err) {
            res.status(200).send({
            success: true,
            msg: "Order Created",
            amount: amount,
            key_id: RAZORPAY_ID_KEY,
            });
        } else {
            res.status(400).send({ success: false, msg: "Something went wrong!" });
        }
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).render('500');
    }
}

// Verify Order
const re_verifyOrder = async(req,res)=> {
    try {
        const {orderId} = req.body;
        const orderObjId = new ObjectId(orderId);
        const userData = await User.findOne({email : req.session.user});
        const order = await Order.findById(orderObjId);
        const items = order.products;

        // decreasing cart quantity
        for(let item of items) {
            const productId = item.productId;
            await Product.updateOne(
                {_id : productId , "sizes.size" : item.size},
                {$inc : {"sizes.$.stock": -item.quantity}}
            );
        }
        
        // updating order status
        const orderUpdate = await Order.findByIdAndUpdate(orderObjId , {
            status : 'Pending',
        });

        // Deleting cart items
        await cartModel.deleteMany({ userId: userData._id });

        if(orderUpdate) {
            res.json({success : true})
        }else {
            res.status(500).json({success : false});
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).render('500');
    }
}

module.exports = {
    order_repayment,
    re_verifyOrder,
}