import { MarketingPage } from "@/components/marketing/marketing-page";

export default function AboutPage() {
  return (
    <MarketingPage
      title="About PathologyLab Pro"
      subtitle="We help pathology centers run faster, reduce report turnaround time, and improve billing visibility with one connected workflow."
      points={[
        "Built for modern pathology operations with role-based access.",
        "From patient registration to report release on a single platform.",
        "Designed for scale with secure Supabase-backed architecture.",
      ]}
    />
  );
}
