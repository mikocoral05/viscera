function parse(text) {
  const transactionReference = (text.match(
    /(?:Reference|Transaction\s*ID|Ref(?:\.|#)?)[^\w]?[:\-]?\s*([A-Z0-9\-]+)/i
  ) || [])[1];

  const sender = (text.match(/(?:Sender|From)\s*[:\-]?\s*(.+)/i) || [])[1];

  const receiver = (text.match(
    /(?:Receiver|To|Beneficiary)\s*[:\-]?\s*(.+)/i
  ) || [])[1];

  const accountNo = (text.match(
    /(?:Account(?:\s*Number| No)?|Acct\.?\s*#?)[:\-]?\s*([\d\-]+)/i
  ) || [])[1];

  const amount = (text.match(
    /(?:Amount|Deposit|Paid)\s*[:\-]?\s*(?:₱|\$|€|£)?\s*([\d,.]+)/i
  ) || [])[1];

  const dateMatch = text.match(
    /(?:Date|Transaction\s*Date|Txn\s*Date)\s*[:\-]?\s*([\w\s,\/\-]+)/i
  );
  const date = dateMatch ? new Date(dateMatch[1]) : null;

  const remarks = (text.match(/(?:Remarks|Note|Purpose)\s*[:\-]?\s*(.+)/i) ||
    [])[1];

  return {
    category: "bank_receipt",
    transaction_reference: transactionReference?.trim() || null,
    sender: sender?.trim() || null,
    receiver: receiver?.trim() || null,
    accountNo: accountNo?.trim() || null,
    amount: amount ? parseFloat(amount.replace(/,/g, "")) : null,
    date,
    remarks: remarks?.trim() || null,
  };
}

module.exports = { parse };

/**
 * Supported Bank Receipts (Tested/Expected Compatibility)
 *
 * This parser is designed to work with digital bank receipts that contain standard fields
 * like Reference No, Sender, Receiver, Account No, Amount, and Date.
 *
 * ✅ Compatible or Likely Compatible Banks:
 *
 * — 🇵🇭 Philippines:
 *   - BDO (Banco de Oro)
 *   - BPI (Bank of the Philippine Islands)
 *   - Metrobank
 *   - Landbank
 *   - RCBC
 *   - Security Bank
 *   - UnionBank
 *   - GCash (App screenshot, email receipt)
 *   - Maya (PayMaya)
 *
 * — 🇸🇬 Singapore:
 *   - DBS
 *   - OCBC
 *   - UOB
 *   - POSB
 *   - PayNow / FAST transfers
 *
 * — 🇺🇸 United States:
 *   - Chase
 *   - Bank of America (BofA)
 *   - Wells Fargo
 *   - Citibank
 *   - Capital One
 *
 * — 🇪🇺 Europe:
 *   - Barclays (UK)
 *   - Deutsche Bank (Germany)
 *   - ING
 *   - Revolut
 *   - N26
 *
 * — 🌍 Global/Fintech:
 *   - Wise (formerly TransferWise)
 *   - Payoneer
 *   - Revolut
 *   - Monzo
 *   - Starling Bank
 *
 * 📝 Note: This parser uses keyword-based regex matching. If a bank's receipt format
 * is highly visual (e.g., only QR codes, no text), OCR may be required before parsing.
 */
