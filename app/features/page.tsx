import { MarketingPage } from "@/components/marketing/marketing-page";

export default function FeaturesPage() {
  return (
    <MarketingPage
      title="Platform Features"
      subtitle="Everything your pathology operation needs in one interface, designed for speed, quality, and transparency."
      points={[
        "Role-based module access across all teams.",
        "Advanced data grids with search, sorting, and pagination.",
        "End-to-end operational visibility from order to report.",
      ]}
    />
  );
}
