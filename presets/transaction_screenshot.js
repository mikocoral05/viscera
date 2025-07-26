// presets/transaction_screenshot.js
function parse(text) {
  const balance = (text.match(
    /(?:Balance|Available Funds)\s*:?\s*₱?\s*([\d,.]+)/i
  ) || [])[1];
  const account = (text.match(
    /(?:Acct\.?\s*#?|Card Number)\s*:?\s*([\d-]+)/i
  ) || [])[1];
  const timestamp =
    text.match(/\b(\w+ \d{1,2},? \d{4}).*?(\d{1,2}:\d{2} [APMapm]{2})?/) || [];
  const date = timestamp[1]
    ? new Date(`${timestamp[1]} ${timestamp[2] || ""}`)
    : null;

  return {
    category: "transaction_screenshot",
    balance: balance ? parseFloat(balance.replace(/,/g, "")) : null,
    accountNo: account?.trim() || null,
    transactionDate: isNaN(date) ? null : date,
  };
}

module.exports = { parse };
