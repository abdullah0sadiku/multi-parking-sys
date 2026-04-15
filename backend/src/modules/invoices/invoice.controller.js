const service = require('./invoice.service');
const { generateInvoicePdf } = require('./invoice.pdf');
const { AppError } = require('../../utils/AppError');

async function list(req, res, next) {
  try {
    const result = await service.list(req.query);
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
}

async function getById(req, res, next) {
  try {
    const row = await service.getById(Number(req.params.id));
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

async function download(req, res, next) {
  try {
    const inv = await service.getById(Number(req.params.id));
    if (!inv) throw new AppError('Invoice not found', 404, 'NOT_FOUND');

    const pdfBuffer = await generateInvoicePdf(inv);
    const filename  = `INV-${String(inv.id).padStart(4, '0')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (e) {
    next(e);
  }
}

module.exports = { list, getById, download };
