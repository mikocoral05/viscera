/**
 * Supported Invoice/Bill Formats (Expected Fields)
 *
 * ✅ Compatible With:
 * - Freelance invoices (PDF, screenshot, email)
 * - Utility bills (Meralco, PLDT, Globe, etc.)
 * - eCommerce receipts (Shopee, Lazada, Amazon)
 * - Corporate invoices (QuickBooks, FreshBooks, PayPal invoices)
 *
 * 🔍 Fields Extracted:
 * - invoiceNo: Invoice or bill number
 * - totalAmount: Grand total (with currency support)
 * - dueDate: When payment is due
 * - billDate: Date of issue
 * - vendor: Company or issuer name
 * - client: Billed-to person or company
 */

function parse(text) {
  const invoiceNo = (text.match(
    /(?:Invoice|Bill)\s*(?:No\.|Number|#)?[:\-]?\s*([\w\-]+)/i
  ) || [])[1];

  const total =
    text.match(
      /(?:Total\s*Amount|Amount\s*Due|Grand\s*Total)\s*[:\-]?\s*(₱|\$|€|£)?\s*([\d,.]+)/i
    ) || [];

  const currency = total?.[1] || null;
  const totalAmount = total?.[2]
    ? parseFloat(total[2].replace(/,/g, ""))
    : null;

  const dueDateRaw = (text.match(
    /(?:Due\s*Date|Pay\s*By)\s*[:\-]?\s*([\w\s,\/\-]+)/i
  ) || [])[1];
  const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;

  const billDateRaw = (text.match(
    /(?:Date\s*Issued|Bill\s*Date|Invoice\s*Date)\s*[:\-]?\s*([\w\s,\/\-]+)/i
  ) || [])[1];
  const billDate = billDateRaw ? new Date(billDateRaw) : null;

  const vendor = (text.match(/(?:From|Vendor|Supplier)\s*[:\-]?\s*(.+)/i) ||
    [])[1];

  const client = (text.match(
    /(?:To|Client|Customer|Billed\s*To)\s*[:\-]?\s*(.+)/i
  ) || [])[1];

  return {
    category: "invoice_or_bill",
    invoiceNo: invoiceNo?.trim() || null,
    totalAmount,
    currency: currency?.trim() || null,
    dueDate: isNaN(dueDate) ? null : dueDate,
    billDate: isNaN(billDate) ? null : billDate,
    vendor: vendor?.trim() || null,
    client: client?.trim() || null,
  };
}

module.exports = { parse };
