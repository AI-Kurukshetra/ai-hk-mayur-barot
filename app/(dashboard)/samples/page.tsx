import { requirePageRoles } from "@/lib/auth/permissions";
import { listSamples } from "@/lib/samples/service";
import { SamplesConsole } from "./_components/samples-console";

type SearchProps = { searchParams?: Promise<{ q?: string }> };

export default async function SamplesPage({ searchParams }: SearchProps) {
  await requirePageRoles(["tenant_admin", "phlebotomist", "technician"]);
  const params = (await searchParams) ?? {};
  const q = (params.q ?? "").trim().toLowerCase();

  const allSamples = await listSamples();
  const samples = q
    ? allSamples.filter((s) =>
        [s.sample_barcode, s.order_no, s.patient_name, s.test_name, s.status].join(" ").toLowerCase().includes(q)
      )
    : allSamples;

  return (
    <section className="grid page-gap">
      <header className="section-head">
        <h2>Sample desk</h2>
      </header>
      <SamplesConsole initialSamples={samples} />
    </section>
  );
}
