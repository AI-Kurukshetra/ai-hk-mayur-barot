import { MarketingPage } from "@/components/marketing/marketing-page";

export default function BlogPage() {
  return (
    <MarketingPage
      title="Knowledge & Updates"
      subtitle="Read practical insights on pathology operations, diagnostics quality, and digital transformation."
      points={[
        "Guides for improving report turnaround performance.",
        "Best practices for sample traceability and quality checks.",
        "Product updates and new workflow capabilities.",
      ]}
    />
  );
}
