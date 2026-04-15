const PDFDocument = require('pdfkit');

/**
 * Formats a JS Date or ISO string to "DD MMM YYYY".
 */
function fmtDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Formats a numeric value to 2 decimal places.
 */
function fmtMoney(val, currency = 'USD') {
  return `${currency} ${Number(val ?? 0).toFixed(2)}`;
}

/**
 * Generates a PDF buffer for a single invoice row (enriched with joined fields).
 * @param {object} inv - The invoice row from invoice.repository.findById
 * @returns {Promise<Buffer>}
 */
function generateInvoicePdf(inv) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Derive unified fields from whichever path produced the invoice ──────
    const isSession     = !!inv.parking_session_id;
    const customerName  = inv.sess_customer_name  ?? inv.sub_customer_name  ?? '—';
    const customerEmail = inv.sess_customer_email ?? inv.sub_customer_email ?? '—';
    const customerPhone = inv.sess_customer_phone ?? inv.sub_customer_phone ?? '—';
    const licensePlate  = inv.sess_license_plate  ?? inv.sub_license_plate  ?? '—';
    const vehicleType   = inv.sess_vehicle_type                             ?? '—';
    const spotCode      = inv.sess_spot_code      ?? inv.sub_spot_code      ?? '—';
    const levelName     = inv.sess_level_name     ?? inv.sub_level_name     ?? '—';
    const tariffName    = inv.sess_tariff_name    ?? inv.sub_tariff_name    ?? '—';
    const currency      = inv.sess_currency       ?? inv.sub_currency       ?? 'USD';
    const invoiceNum    = `INV-${String(inv.id).padStart(4, '0')}`;

    const BLUE   = '#2563EB';
    const DARK   = '#111827';
    const GRAY   = '#6B7280';
    const LGRAY  = '#F3F4F6';
    const RED    = '#DC2626';
    const GREEN  = '#16A34A';
    const LEFT   = 50;
    const RIGHT  = 545;
    const W      = RIGHT - LEFT;

    // ── Header bar ─────────────────────────────────────────────────────────
    doc.rect(LEFT - 50, 0, 595, 90).fill(BLUE);
    doc.fillColor('#FFFFFF')
       .fontSize(22).font('Helvetica-Bold')
       .text('PARKING INVOICE', LEFT, 28);
    doc.fontSize(10).font('Helvetica')
       .text('ParkAdmin Management System', LEFT, 54);

    // Invoice number top-right
    doc.fontSize(13).font('Helvetica-Bold')
       .text(invoiceNum, 0, 32, { align: 'right', width: 545 });
    doc.fontSize(9).font('Helvetica')
       .text(`Issued: ${fmtDate(inv.issued_at)}`, 0, 52, { align: 'right', width: 545 });

    // ── Two-column info block ───────────────────────────────────────────────
    let y = 110;
    doc.fillColor(DARK);

    // Left: Customer details
    doc.fontSize(8).font('Helvetica-Bold').fillColor(GRAY).text('BILLED TO', LEFT, y);
    y += 14;
    doc.fontSize(11).font('Helvetica-Bold').fillColor(DARK).text(customerName, LEFT, y);
    y += 16;
    doc.fontSize(9).font('Helvetica').fillColor(GRAY);
    if (customerEmail && customerEmail !== '—') { doc.text(customerEmail, LEFT, y); y += 13; }
    if (customerPhone && customerPhone !== '—') { doc.text(customerPhone, LEFT, y); y += 13; }

    // Right: Invoice meta
    const metaX = 360;
    let metaY   = 110;
    const metaRow = (label, value, color = DARK) => {
      doc.fontSize(8).font('Helvetica').fillColor(GRAY).text(label, metaX, metaY, { width: 90 });
      doc.fontSize(9).font('Helvetica-Bold').fillColor(color).text(value, metaX + 95, metaY, { width: 100 });
      metaY += 16;
    };

    const statusColor = inv.status === 'paid' ? GREEN : inv.status === 'cancelled' ? RED : '#D97706';
    metaRow('Invoice #:',  invoiceNum);
    metaRow('Status:',     inv.status.toUpperCase(), statusColor);
    metaRow('Issue Date:', fmtDate(inv.issued_at));
    metaRow('Due Date:',   fmtDate(inv.due_at));

    // ── Divider ────────────────────────────────────────────────────────────
    y = Math.max(y, metaY) + 14;
    doc.moveTo(LEFT, y).lineTo(RIGHT, y).lineWidth(0.5).strokeColor('#E5E7EB').stroke();
    y += 14;

    // ── Line items table ───────────────────────────────────────────────────
    // Header
    doc.rect(LEFT, y, W, 22).fill(LGRAY);
    const colDesc   = LEFT + 8;
    const colDetail = LEFT + 240;
    const colQty    = LEFT + 370;
    const colRate   = LEFT + 420;
    const colAmt    = RIGHT - 8;

    doc.fontSize(8).font('Helvetica-Bold').fillColor(GRAY);
    doc.text('DESCRIPTION',  colDesc,   y + 7);
    doc.text('DETAIL',       colDetail, y + 7);
    doc.text('QTY',          colQty,    y + 7);
    doc.text('RATE',         colRate,   y + 7);
    doc.text('AMOUNT',       colAmt - 40, y + 7, { width: 48, align: 'right' });
    y += 22;

    // Row helper
    const tableRow = (desc, detail, qty, rate, amount) => {
      const rowH = 28;
      doc.fontSize(9).font('Helvetica').fillColor(DARK);
      doc.text(desc,   colDesc,   y + 8, { width: 190 });
      doc.text(detail, colDetail, y + 8, { width: 120 });
      doc.text(qty,    colQty,    y + 8, { width: 44 });
      doc.text(rate,   colRate,   y + 8, { width: 44 });
      doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK)
         .text(amount, colAmt - 40, y + 8, { width: 48, align: 'right' });
      y += rowH;
      doc.moveTo(LEFT, y).lineTo(RIGHT, y).lineWidth(0.3).strokeColor('#E5E7EB').stroke();
    };

    if (isSession) {
      // Parking session invoice
      const durationMins = Number(inv.sess_duration_minutes ?? 0);
      const hours        = Math.max(1, Math.ceil(durationMins / 60));
      const ratePerHour  = Number(inv.sess_rate_per_hour ?? 0);

      tableRow(
        'Parking Session',
        `${licensePlate} · ${spotCode} (${levelName})`,
        `${hours} hr${hours !== 1 ? 's' : ''}`,
        fmtMoney(ratePerHour, currency) + '/hr',
        fmtMoney(inv.subtotal, currency),
      );
      if (tariffName !== '—') {
        y += 4;
        doc.fontSize(8).font('Helvetica').fillColor(GRAY)
           .text(`Tariff: ${tariffName}`, colDesc, y);
        y += 12;
        doc.fontSize(8).fillColor(GRAY)
           .text(`Session: ${fmtDate(inv.sess_started_at)} → ${fmtDate(inv.sess_ended_at)}   Duration: ${durationMins} min`, colDesc, y);
        y += 16;
      }
    } else {
      // Subscription invoice
      tableRow(
        'Monthly Subscription',
        `${licensePlate} · ${spotCode !== '—' ? spotCode + ' (' + levelName + ')' : 'Open spot'}`,
        '1 month',
        tariffName !== '—' ? tariffName : '—',
        fmtMoney(inv.subtotal, currency),
      );
      if (inv.sub_valid_from) {
        y += 4;
        doc.fontSize(8).font('Helvetica').fillColor(GRAY)
           .text(`Period: ${fmtDate(inv.sub_valid_from)} → ${fmtDate(inv.sub_valid_to)}`, colDesc, y);
        y += 16;
      }
    }

    // ── Totals ──────────────────────────────────────────────────────────────
    y += 10;
    const totX    = 380;
    const totValX = RIGHT - 8;
    const totW    = 160;

    const totRow = (label, value, bold = false, color = DARK) => {
      doc.fontSize(9)
         .font(bold ? 'Helvetica-Bold' : 'Helvetica')
         .fillColor(color)
         .text(label, totX, y, { width: totW - 60 });
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(color)
         .text(value, totX + 100, y, { width: totW - 40, align: 'right' });
      y += 16;
    };

    totRow('Subtotal:', fmtMoney(inv.subtotal, currency));
    totRow(`VAT (${Number(inv.vat_rate).toFixed(0)}%):`, fmtMoney(inv.vat_amount, currency));

    // Total box
    doc.rect(totX - 4, y - 2, totW + 4, 24).fill(BLUE);
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#FFFFFF')
       .text('TOTAL DUE:', totX, y + 5, { width: totW - 60 });
    doc.text(fmtMoney(inv.total, currency), totX + 100, y + 5, { width: totW - 40, align: 'right' });
    y += 34;

    // ── Notes / footer ──────────────────────────────────────────────────────
    y += 10;
    doc.moveTo(LEFT, y).lineTo(RIGHT, y).lineWidth(0.5).strokeColor('#E5E7EB').stroke();
    y += 12;

    if (inv.status === 'paid') {
      doc.rect(LEFT, y, W, 24).fill('#F0FDF4');
      doc.fontSize(10).font('Helvetica-Bold').fillColor(GREEN)
         .text('✓  This invoice has been paid. Thank you!', LEFT + 8, y + 7);
      y += 32;
    } else if (inv.status === 'pending') {
      doc.rect(LEFT, y, W, 24).fill('#FFFBEB');
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#92400E')
         .text('⚠  Payment pending. Please settle by the due date.', LEFT + 8, y + 7);
      y += 32;
    }

    // Footer
    const pageH = doc.page.height;
    doc.fontSize(8).font('Helvetica').fillColor(GRAY)
       .text(
         'ParkAdmin Management System  ·  Generated automatically  ·  Please retain for your records.',
         LEFT, pageH - 50, { width: W, align: 'center' }
       );

    doc.end();
  });
}

module.exports = { generateInvoicePdf };
