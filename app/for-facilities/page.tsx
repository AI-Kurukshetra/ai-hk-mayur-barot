import { MarketingPage } from "@/components/marketing/marketing-page";

export default function ForFacilitiesPage() {
  return (
    <MarketingPage
      title="For Collection Facilities"
      subtitle="Coordinate sample collection centers and main lab teams with consistent case visibility and status updates."
      points={[
        "Track pending, collected, and received samples in real time.",
        "Reduce missed handoffs with clear status transitions.",
        "Improve turn-around commitments with live dashboards.",
      ]}
    />
  );
}
