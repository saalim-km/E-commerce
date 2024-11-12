const Order = require('../models/order');
const Product = require('../models/product');
const Razorpay = require("razorpay");
const { ObjectId } = require("mongoose").Types;

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});


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
    }
}

const re_verifyOrder = async(req,res)=> {
    try {
        const {orderId} = req.body;
        const orderObjId = new ObjectId(orderId);
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

        if(orderUpdate) {
            res.json({success : true})
        }else {
            res.status(500).json({success : false});
        }
    } catch (error) {
    }
}
module.exports = {
    order_repayment,
    re_verifyOrder,
}