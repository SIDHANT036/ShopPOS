const PDFDocument=require("pdfkit");
const fs=require("fs");


function createPDF(invoice){


const doc=new PDFDocument();


const file=`invoice_${invoice.invoiceNo}.pdf`;


doc.pipe(
fs.createWriteStream(file)
);



doc.fontSize(20)
.text("Document Centre");


doc.fontSize(12)
.text(
"opposite SBI, College Road, Ropar, Punjab, India (140001)"
);



doc.moveDown();


doc.text(
"Invoice No: "+invoice.invoiceNo
);


doc.text(
"Date: "+new Date()
);



doc.moveDown();



invoice.items.forEach(i=>{


doc.text(
`${i.name}  Qty:${i.quantity}  Price:${i.price}`
);


});



doc.moveDown();


doc.text(
`GST: ${invoice.gst}`
);


doc.text(
`TOTAL: ${invoice.total}`
);



doc.end();



}


module.exports=createPDF;