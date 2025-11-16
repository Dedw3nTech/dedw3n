import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { useMemo } from "react";

export default function PaymentOptionsPage() {
  const pageTexts = useMemo(() => [
    "Payment Options",
    "We accept various payment methods to make your shopping experience convenient and secure.",
    "Credit & Debit Cards",
    "We accept major credit and debit cards including Visa, Mastercard, American Express, and Discover.",
    "Mobile Money",
    "Pay using mobile money services available in your region for quick and easy transactions.",
    "Digital Wallets",
    "Use popular digital wallet services for fast and secure checkout.",
    "PayPal",
    "Shop with confidence using PayPal for buyer protection and easy refunds.",
    "Secure Transactions",
    "All payment methods use industry-standard encryption to protect your financial information.",
  ], []);

  const { translations } = useMasterBatchTranslation(pageTexts);
  
  const [
    titleText,
    descriptionText,
    creditCardTitle,
    creditCardDesc,
    mobileMoneyTitle,
    mobileMoneyDesc,
    digitalWalletTitle,
    digitalWalletDesc,
    paypalTitle,
    paypalDesc,
    secureTitle,
    secureDesc,
  ] = translations || pageTexts;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">{titleText}</h1>
      <p className="mb-6">{descriptionText}</p>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">{creditCardTitle}</h2>
          <p>{creditCardDesc}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">{mobileMoneyTitle}</h2>
          <p>{mobileMoneyDesc}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">{digitalWalletTitle}</h2>
          <p>{digitalWalletDesc}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">{paypalTitle}</h2>
          <p>{paypalDesc}</p>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">{secureTitle}</h2>
          <p>{secureDesc}</p>
        </div>
      </div>
    </div>
  );
}
