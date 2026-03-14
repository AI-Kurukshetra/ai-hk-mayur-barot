import { MarketingPage } from "@/components/marketing/marketing-page";

export default function ForPathologiesPage() {
  return (
    <MarketingPage
      title="For Pathology Labs"
      subtitle="Standardize your daily diagnostic flow with accurate sample tracking, result entry, and report dispatch."
      points={[
        "Digital case intake with fast order creation.",
        "Barcode-ready sample lifecycle management.",
        "Department-wise result queues with validations.",
      ]}
    />
  );
}
