import { MarketingPage } from "@/components/marketing/marketing-page";

export default function LearnMorePage() {
  return (
    <MarketingPage
      title="Learn More"
      subtitle="Discover how PathologyLab Pro helps teams increase throughput, improve quality, and deliver reports faster."
      points={[
        "Operational dashboards for real-time decision making.",
        "Secure authentication and role-specific module access.",
        "Scalable architecture with Next.js, Supabase, and Vercel.",
      ]}
    />
  );
}
