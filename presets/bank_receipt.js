// presets/bank_receipt.js
function parse(text) {
  const accountNo = (text.match(
    /(?:Account No|Acct\.?\s*#?)\s*:?\s*([\d\-]+)/i
  ) || [])[1];
  const amount = (text.match(/(?:Amount|Deposit)\s*:?\s*₱?\s*([\d,.]+)/i) ||
    [])[1];
  const dateMatch = text.match(
    /(?:Date|Transaction Date)\s*:?\s*(\w+ \d{1,2},? \d{4})/
  );
  const name = (text.match(/Depositor\s*:?\s*(.+)/i) || [])[1];

  const date = dateMatch ? new Date(dateMatch[1]) : null;

  return {
    category: "bank_receipt",
    accountNo: accountNo?.trim() || null,
    depositor: name?.trim() || null,
    amount: amount ? parseFloat(amount.replace(/,/g, "")) : null,
    date,
  };
}

module.exports = { parse };
