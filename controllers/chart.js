const Order = require("../models/order");
const moment = require('moment');

const chart = async(req,res)=> {
    try {
        const { filter } = req.body;
        let startDate;
        let dateFormat;

        if(filter == 'last10Days'){
            startDate = moment().subtract(10 , 'days').startOf('day').toDate();
            dateFormat = 'YYYY-MM-DD';
        }else if(filter == 'monthly'){
            startDate = moment().startOf('month').toDate();
            dateFormat = 'MMMM'; 
        }else if(filter == 'yearly') {
            startDate = moment().startOf('year').toDate();
            dateFormat = 'YYYY'; 
        }

        const orders = await Order.find({ createdAt : {$gte : startDate} , status : 'Delivered'});

        const labels = [];
        const dataset = [];

        orders.forEach((order)=> {
            const date = moment(order.createdAt).format(dateFormat);
            const index = labels.indexOf(date);
            if(index < 0){
                labels.push(date);
                dataset.push(order.totalAmount);
            }else{
                dataset[index] += order.totalAmount;
            }
        })

        res.json({labels , dataset});
    } catch (error) {
        console.log(error.message);
        res.status(500).render('500');
    }
}

module.exports = {
    chart,
}