import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { useMemo } from "react";

export default function DeliveryReturnsPage() {
  const pageTexts = useMemo(() => [
    "Delivery & Return Options",
    "We strive to provide flexible delivery and return options to ensure your satisfaction.",
    "Delivery Options",
    "We offer various delivery methods including standard shipping, express delivery, and same-day delivery in select locations. Delivery times vary based on your location and the shipping method selected at checkout.",
    "Delivery Timeframes",
    "Standard delivery typically takes 3-7 business days. Express delivery is available within 1-3 business days. Same-day delivery is available for select products in major cities when ordered before 12 PM.",
    "Return Policy",
    "You may return most items within 30 days of delivery for a full refund. Items must be unused and in original packaging with all tags attached.",
    "How to Return",
    "To initiate a return, please visit your order history and select the item you wish to return. Follow the instructions to print a prepaid return label. Package the item securely and drop it off at any authorized shipping location.",
    "Refunds",
    "Refunds are processed within 5-10 business days after we receive your returned item. The refund will be credited to your original payment method.",
    "Exchanges",
    "We offer exchanges for size, color, or style variations. Simply select the exchange option when initiating your return and choose your preferred replacement item.",
  ], []);

  const { translations } = useMasterBatchTranslation(pageTexts);
  
  const [
    titleText,
    descriptionText,
    deliveryOptionsTitle,
    deliveryOptionsDesc,
    deliveryTimeframesTitle,
    deliveryTimeframesDesc,
    returnPolicyTitle,
    returnPolicyDesc,
    howToReturnTitle,
    howToReturnDesc,
    refundsTitle,
    refundsDesc,
    exchangesTitle,
    exchangesDesc,
  ] = translations || pageTexts;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">{titleText}</h1>
      <p className="mb-6">{descriptionText}</p>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">{deliveryOptionsTitle}</h2>
          <p>{deliveryOptionsDesc}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">{deliveryTimeframesTitle}</h2>
          <p>{deliveryTimeframesDesc}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">{returnPolicyTitle}</h2>
          <p>{returnPolicyDesc}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">{howToReturnTitle}</h2>
          <p>{howToReturnDesc}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">{refundsTitle}</h2>
          <p>{refundsDesc}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">{exchangesTitle}</h2>
          <p>{exchangesDesc}</p>
        </div>
      </div>
    </div>
  );
}
