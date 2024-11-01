const PDFDocument = require("pdfkit");
const orderModel = require("../models/order");

const reportPage = async (req, res) => {
    try {
        const today = new Date();
        const defaultStartDate = new Date(0); 
        const defaultEndDate = today;

        res.render("salesReport", {
            salesData: [],       
            totalSales: 0,      
            start: defaultStartDate,
            end: defaultEndDate
        });
    } catch (error) {
        console.log("Error in report loading page:", error.message);
        res.status(500).send("Internal Server Error");
    }
};


const filterSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, filterOption } = req.body;
        const today = new Date();
        let start, end;

        if (startDate && endDate) {
            const newStDate = new Date(startDate);
            const newEndDate = new Date(endDate);

            if (isNaN(newStDate.getTime()) || isNaN(newEndDate.getTime())) {
                console.log("Invalid custom date range provided");
                return res.redirect("/admin/salesReport");
            }

            console.log(`Custom start date: ${newStDate}, custom end date: ${newEndDate}`);
            const salesData = await orderModel.find({
                createdAt: { $gte: newStDate, $lte: newEndDate }
            }).sort({ createdAt: -1 });

            const totalSales = salesData.reduce((sum, order) => sum + order.backupTotalAmount, 0);

            return res.render("reportsList", {
                salesData,
                totalSales
            });
        }

        // Filter options based on filterOption
        if (filterOption === '1-day') {
            start = new Date(today);
            start.setDate(today.getDate() - 1);
            end = today;
        } else if (filterOption === '1-week') {
            start = new Date(today);
            start.setDate(today.getDate() - 7);
            end = today;
        } else if (filterOption === '1-month') {
            start = new Date(today);
            start.setMonth(today.getMonth() - 1);
            end = today;
        } else {
            console.log("Invalid filter option provided");
            return res.redirect("/admin/salesReport");
        }

        // Fetch and calculate sales for selected filter
        const salesData = await orderModel.find({
            createdAt: { $gte: start, $lte: end }
        }).sort({ createdAt: -1 });

        const totalSales = salesData.reduce((sum, order) => sum + order.backupTotalAmount, 0);

        res.render("reportsList", {
            salesData,
            totalSales,
        });
    } catch (error) {
        console.log("Error in filtering sales report:", error.message);
        res.status(500).send("Internal Server Error");
    }
};



const downloadSalesReportPdf = async(req,res)=> {
    try {

        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(endDate.getFullYear(), endDate.getMonth() - 1, endDate.getDate());


        const salesData = await orderModel.find({
            createdAt: { $gte: startDate, $lte: endDate },
        });

      
        const totalSales = salesData.reduce((sum, order) => sum + order.totalAmount, 0);

        
        const doc = new PDFDocument();
        res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');
        res.setHeader('Content-Type', 'application/pdf');

        doc.pipe(res);

        doc.fontSize(20).text('Sales Report', { align: 'center' });
        doc.fontSize(12).text(`From: ${startDate.toDateString()} To: ${endDate.toDateString()}`, { align: 'center' });
        doc.moveDown();

        doc.fontSize(16).text(`Total Sales: ₹${totalSales.toLocaleString()}`, { align: 'left' });
        doc.moveDown();

        doc.fontSize(12).text('Order ID', { width: 90, continued: true })
            .text('Date', { width: 90, continued: true })
            .text('Total Amount', { width: 90, continued: true })
            .text('Payment Method', { width: 100, continued: true })
            .text('Status', { width: 100 });
        doc.moveDown();

        salesData.forEach(order => {
            doc.fontSize(10)
                .text(order._id, { width: 90, continued: true })
                .text(new Date(order.createdAt).toLocaleDateString(), { width: 90, continued: true })
                .text(`₹${order.totalAmount.toLocaleString()}`, { width: 90, continued: true })
                .text(order.paymentMethod, { width: 100, continued: true })
                .text(order.status, { width: 100 });
            doc.moveDown();
        });

        doc.end();

    } catch (error) {
        console.error("Error generating PDF:", error.message);
        res.status(500).json({ success: false, message: "Failed to generate PDF" });
    }
}

module.exports = {
    reportPage,
    filterSalesReport,
    downloadSalesReportPdf
}