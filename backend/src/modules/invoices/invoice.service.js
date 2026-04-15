const { AppError } = require('../../utils/AppError');
const { parsePagination, paginationMeta } = require('../../utils/pagination');
const repo = require('./invoice.repository');

async function getById(id) {
  const row = await repo.findById(id);
  if (!row) throw new AppError('Invoice not found', 404, 'NOT_FOUND');
  return row;
}

async function list(query) {
  const { page, limit, offset } = parsePagination(query);
  const { rows, total } = await repo.list({
    offset,
    limit,
    customer_id: query.customer_id ? Number(query.customer_id) : undefined,
    status: query.status || undefined,
    search: query.search || undefined,
  });
  return {
    items: rows,
    meta: paginationMeta({ page, limit, total }),
  };
}

module.exports = { getById, list };
