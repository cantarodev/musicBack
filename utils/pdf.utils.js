const PDFDocument = require("pdfkit");
const fs = require("fs");
const User = require("../models/user.model");

async function generatePDF(res) {
  try {
    const users = await User.findAll();

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream("usuarios.pdf"));

    doc.fontSize(18).text("Lista de Usuarios (Izitax)", { align: "center" });
    doc.moveDown();

    users.forEach((user, index) => {
      doc
        .fontSize(14)
        .text(
          `${index + 1}. Nombre: ${user.businessName}, Email: ${user.email}`
        );
      doc.moveDown();
    });

    doc.end();
    res.download("usuarios.pdf");
  } catch (error) {
    console.error("Error al generar el PDF:", error);
    res.status(500).send("Error al generar el PDF");
  }
}

module.exports = { generatePDF };
