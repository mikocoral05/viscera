// presets/invoice_or_bill.js
function parse(text) {
  const invoiceNo = (text.match(/Invoice\s*(?:No\.|#)\s*:?\s*([\w-]+)/i) ||
    [])[1];
  const total = (text.match(/Total\s*Amount\s*:?\s*₱?\s*([\d,.]+)/i) || [])[1];
  const dueDate = (text.match(
    /(?:Due\s*Date|Pay\s*By)\s*:?\s*(\w+ \d{1,2},? \d{4})/
  ) || [])[1];

  const date = dueDate ? new Date(dueDate) : null;

  return {
    category: "invoice_or_bill",
    invoiceNo: invoiceNo?.trim() || null,
    totalAmount: total ? parseFloat(total.replace(/,/g, "")) : null,
    dueDate: isNaN(date) ? null : date,
  };
}

module.exports = { parse };
