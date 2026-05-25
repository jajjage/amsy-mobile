import { BadgeCheck } from "lucide-react-native";

import { ProductPurchaseScreen } from "./data";

export default function SubscriptionScreen() {
  return (
    <ProductPurchaseScreen
      productType="subscription"
      title="Call Sub"
      returnRoute="/subscription"
      processingMessage="Processing your call subscription..."
      EmptyIcon={BadgeCheck}
    />
  );
}
