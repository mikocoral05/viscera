const fixtures = {
  mobile: {
    name: "mobile_receipt",
    description: "Wallet transfers with reference, receiver, amount, and timestamp fields.",
    image: "./assets/fixtures/mobile-receipt.png",
    alt: "Sample mobile receipt fixture",
    caption: "A crisp wallet receipt fixture shared by the docs page and the OCR fixture tests.",
    json: `{
  "category": "mobile_receipt",
  "platform": "gcash",
  "amountValue": 1250,
  "currency": "PHP",
  "reference": "700123456789",
  "receiver": "Maria Cruz"
}`,
  },
  invoice: {
    name: "invoice_or_bill",
    description: "An invoice fixture with issuer, client, total, and due-date fields.",
    image: "./assets/fixtures/invoice.png",
    alt: "Sample invoice fixture",
    caption: "This fixture is used to verify invoice parsing and to make the docs examples tangible.",
    json: `{
  "category": "invoice_or_bill",
  "invoiceNumber": "INV-2201",
  "vendor": "Northwind Studio",
  "client": "Acme Corp",
  "totalAmount": 199,
  "currency": "USD"
}`,
  },
  bank: {
    name: "bank_receipt",
    description: "A bank transfer fixture with sender, receiver, amount, and transaction reference.",
    image: "./assets/fixtures/bank-receipt.png",
    alt: "Sample bank receipt fixture",
    caption: "The BDO-style fixture ensures the bank parsers are tested against real OCR output, not just plain text.",
    json: `{
  "category": "bank_receipt",
  "bank": "BDO",
  "transactionReference": "ABC-12345",
  "sender": "John Doe",
  "receiver": "Jane Santos",
  "amount": 2500.75
}`,
  },
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.15 }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

document.querySelectorAll(".copy-button").forEach((button) => {
  button.addEventListener("click", async () => {
    const card = button.closest(".code-card");
    const code = card?.querySelector("code");
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code.textContent);
      const originalLabel = button.textContent;
      button.textContent = "Copied";
      button.classList.add("is-done");
      window.setTimeout(() => {
        button.textContent = originalLabel;
        button.classList.remove("is-done");
      }, 1400);
    } catch (error) {
      button.textContent = "Copy failed";
      window.setTimeout(() => {
        button.textContent = "Copy";
      }, 1400);
    }
  });
});

const tabs = Array.from(document.querySelectorAll(".fixture-tab"));
const fixtureName = document.getElementById("fixture-name");
const fixtureDescription = document.getElementById("fixture-description");
const fixtureImage = document.getElementById("fixture-image");
const fixtureCaption = document.getElementById("fixture-caption");
const fixtureJson = document.querySelector("#fixture-json code");

function setFixture(key) {
  const fixture = fixtures[key];
  if (!fixture) return;

  fixtureName.textContent = fixture.name;
  fixtureDescription.textContent = fixture.description;
  fixtureImage.src = fixture.image;
  fixtureImage.alt = fixture.alt;
  fixtureCaption.textContent = fixture.caption;
  fixtureJson.textContent = fixture.json;

  tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.fixture === key);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setFixture(tab.dataset.fixture));
});

setFixture("mobile");
