const { withTransaction, runOne } = require('../../config/database');
const { AppError } = require('../../utils/AppError');
const { parsePagination, paginationMeta } = require('../../utils/pagination');
const paymentRepo = require('./payment.repository');
const invoiceRepo = require('../invoices/invoice.repository');

async function getById(id) {
  const row = await paymentRepo.findById(id);
  if (!row) throw new AppError('Payment not found', 404, 'NOT_FOUND');
  return row;
}

async function list(query) {
  const { page, limit, offset } = parsePagination(query);
  const { rows, total } = await paymentRepo.list({
    offset,
    limit,
    invoice_id: query.invoice_id ? Number(query.invoice_id) : undefined,
    status: query.status || undefined,
  });
  return {
    items: rows,
    meta: paginationMeta({ page, limit, total }),
  };
}

async function create(body) {
  return withTransaction(async (conn) => {
    const invoice = await runOne(conn, 'SELECT * FROM invoices WHERE id = ? FOR UPDATE', [body.invoice_id]);
    if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    if (invoice.status === 'cancelled') {
      throw new AppError('Cannot pay a cancelled invoice', 409, 'INVOICE_CANCELLED');
    }

    const payment = await paymentRepo.insert(
      {
        invoice_id: body.invoice_id,
        amount: body.amount,
        method: body.method,
        transaction_ref: body.transaction_ref,
        paid_at: body.paid_at,
        status: body.status || 'completed',
      },
      conn
    );

    const paid = await invoiceRepo.sumPaidForInvoice(conn, body.invoice_id);
    if (paid >= Number(invoice.total)) {
      await invoiceRepo.updateStatus(body.invoice_id, 'paid', conn);
    }

    return paymentRepo.findById(payment.id, conn);
  });
}

module.exports = { getById, list, create };
