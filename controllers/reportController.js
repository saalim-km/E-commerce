const PDFDocument = require("pdfkit");
const ExcelJS = require('exceljs');
const {Stream} = require("stream");
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
              return res.redirect("/admin/salesReport");
          }

          newStDate.setUTCHours(0, 0, 0, 0);
          newEndDate.setUTCHours(23, 59, 59, 999); 


          const salesData = await orderModel.find({
              createdAt: { $gte: newStDate, $lte: newEndDate } , status : 'Delivered'
          }).sort({ createdAt: -1 });

          const totalSalesObj = await orderModel.aggregate([
            {"$match" : {createdAt : {$gte : newStDate , $lte : newEndDate} , status : 'Delivered'}},
            {$group : {_id : null , totalSales : {$sum : '$totalAmount'}}}
          ]);
          const totalSales = totalSalesObj.length > 0 ? totalSalesObj[0].totalSales : 0;

          return res.render("reportsList", {
              salesData,
              totalSales ,
              start : startDate,
              end : endDate,
          });
      }

      // Filter options based on filterOption
      end = new Date(today); // Use current time as end time
      end.setUTCHours(23, 59, 59, 999);

      if (filterOption === '1-day') {
          start = new Date(today);
          start.setDate(today.getDate() - 1);
      } else if (filterOption === '1-week') {
          start = new Date(today);
          start.setDate(today.getDate() - 7);
      } else if (filterOption === '1-month') {
          start = new Date(today);
          start.setMonth(today.getMonth() - 1);
      } else {
          return res.redirect("/admin/salesReport");
      }

      start.setUTCHours(0, 0, 0, 0);


      const salesData = await orderModel.find({
          createdAt: { $gte: start, $lte: end }, status: 'Delivered'
      }).sort({ createdAt: -1 });

      const total = await orderModel.aggregate([
          { "$match": { createdAt: { $gte: start, $lte: end }, status: 'Delivered' } },
          { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } }
      ]);
      const totalSales = total[0] ? total[0].totalSales : 0;

      res.render("reportsList", {
          salesData,
          totalSales,
          start,
          end,
      });
  } catch (error) {
      res.status(500).send("Internal Server Error");
  }
};




const downloadSalesReportPdf = async (req, res) => {
    try {

      let endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
      let startDate = req.query.startDate
          ? new Date(req.query.startDate)
          : new Date(endDate.getFullYear(), endDate.getMonth() - 1, endDate.getDate());

      
      endDate.setUTCHours(23, 59, 59, 999);
      startDate.setUTCHours(0, 0, 0, 0);


      const salesData = await orderModel.find({
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'Delivered'
      });

      const total = await orderModel.aggregate([
          {
              "$match": {
                  createdAt: { $gte: startDate, $lte: endDate },
                  status: 'Delivered'
              }
          },
          {
              $group: { _id: null, totalSales: { $sum: '$totalAmount' } }
          }
      ]);


      const totalSales = total.length > 0 ? total[0].totalSales : 0;

      const discount = await orderModel.aggregate([{"$match" : {createdAt : {$gte : startDate , $lte : endDate },status : 'Delivered'}} , {$group : {_id:null , totalDiscount : { $sum : '$discount'}}}])
      const totalDiscount = discount.length > 0 ? discount[0].totalDiscount : 0;

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });
  
      res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');
      res.setHeader('Content-Type', 'application/pdf');
  
      doc.pipe(res);
  
      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('Sales Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`From: ${startDate.toDateString()} To: ${endDate.toDateString()}`, { align: 'center' });
      doc.moveDown(1);
  
      // Summary
      doc.rect(50, doc.y, 495, 80).fill('#f0f0f0');
      doc.fill('#333');
      doc.fontSize(14).font('Helvetica-Bold').text('Summary', 70, doc.y + 20);
      doc.fontSize(12).font('Helvetica').text(`Total Sales: ₹${totalSales.toLocaleString()}`, 70, doc.y + 20);
      doc.text(`Total Orders: ${salesData.length}`, 70, doc.y + 20);
      doc.text(`Total Discount: ${totalDiscount}`, 70, doc.y + 20);
      doc.moveDown(2);
  
      // Table header
      const tableTop = doc.y + 20;
      doc.font('Helvetica-Bold');
      drawTableRow(doc, tableTop, ['Order ID', 'Date', 'Total Amount', 'Payment Method', 'Status']);
      doc.moveDown(0.5);
  
      // Table rows
      let yPosition = doc.y;
      salesData.forEach((order) => {
        if (yPosition + 40 > doc.page.height - 50) {
          doc.addPage();
          yPosition = 50;
          drawTableRow(doc, yPosition, ['Order ID', 'Date', 'Total Amount', 'Payment Method', 'Status']);
          doc.moveDown(0.5);
          yPosition = doc.y;
        }
  
        doc.font('Helvetica');
        drawTableRow(doc, yPosition, [
          order._id.toString().slice(-6),
          new Date(order.createdAt).toLocaleDateString(),
          `₹${order.totalAmount.toLocaleString()}`,
          order.paymentMethod,
          order.status,
        ]);
        doc.moveDown(0.5);
        yPosition = doc.y;
      });
  
      // Footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(10).text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 50, { align: 'center' });
      }
  
      doc.end();
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to generate PDF" });
    }
};


const downloadSalesReportExcel = async (req, res) => {
  try {
    // Set the date range
    let endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    let startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : new Date(endDate.getFullYear(), endDate.getMonth() - 1, endDate.getDate());

    endDate.setUTCHours(23, 59, 59, 999);
    startDate.setUTCHours(0, 0, 0, 0);

    // Fetch sales data and total sales and discount
    const salesData = await orderModel.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'Delivered'
    });

    const total = await orderModel.aggregate([
      {
        "$match": {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'Delivered'
        }
      },
      {
        $group: { _id: null, totalSales: { $sum: '$totalAmount' } }
      }
    ]);
    const totalSales = total.length > 0 ? total[0].totalSales : 0;

    const discount = await orderModel.aggregate([
      {
        "$match": {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'Delivered'
        }
      },
      { $group: { _id: null, totalDiscount: { $sum: '$discount' } } }
    ]);
    const totalDiscount = discount.length > 0 ? discount[0].totalDiscount : 0;

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Add headers to the worksheet
    worksheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Payment Method', key: 'paymentMethod', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    // Add a summary row
    worksheet.addRow([]);
    worksheet.addRow(['Summary']);
    worksheet.addRow(['Total Sales:', `₹${totalSales.toLocaleString()}`]);
    worksheet.addRow(['Total Orders:', salesData.length]);
    worksheet.addRow(['Total Discount:', `₹${totalDiscount}`]);
    worksheet.addRow([]);

    // Add column headers
    worksheet.addRow([]);
    worksheet.addRow(['Order ID', 'Date', 'Total Amount', 'Payment Method', 'Status']);

    // Populate data rows
    salesData.forEach((order) => {
      worksheet.addRow([
        order._id.toString().slice(-6),
        new Date(order.createdAt).toLocaleDateString(),
        `₹${order.totalAmount.toLocaleString()}`,
        order.paymentMethod,
        order.status
      ]);
    });

    // Set response headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to generate Excel file" });
  }
};

function drawTableRow(doc, y, texts) {
    const widths = [80, 100, 100, 120, 95];
    let x = 50;
  
    texts.forEach((text, i) => {
      doc.text(text, x, y, { width: widths[i], align: 'left' });
      x += widths[i];
    });
}

module.exports = {
    reportPage,
    filterSalesReport,
    downloadSalesReportPdf,
    downloadSalesReportExcel,
}