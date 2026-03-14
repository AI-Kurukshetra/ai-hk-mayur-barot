import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getOrCreateDefaultTenant } from "@/lib/core/tenant";
import type { CreatePatientInput } from "@/lib/validations/patients";

export type PatientRow = {
  id: string;
  patient_code: string;
  full_name: string;
  sex: "male" | "female" | "other" | null;
  dob: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
};

export async function listPatients(): Promise<PatientRow[]> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const { data, error } = await supabase
    .from("patients")
    .select("id, patient_code, full_name, sex, dob, phone, email, address, created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`Failed to load patients: ${error.message}`);
  }

  return (data ?? []) as PatientRow[];
}

export async function createPatient(input: CreatePatientInput): Promise<PatientRow> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const { count, error: countError } = await supabase
    .from("patients")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);

  if (countError) {
    throw new Error(`Failed to generate patient code: ${countError.message}`);
  }

  const sequence = String((count ?? 0) + 1).padStart(6, "0");
  const patientCode = `PAT-${sequence}`;

  const payload = {
    tenant_id: tenant.id,
    patient_code: patientCode,
    full_name: input.full_name,
    sex: input.sex,
    dob: input.dob || null,
    phone: input.phone || null,
    email: input.email || null,
    address: input.address || null,
  };

  const { data, error } = await supabase
    .from("patients")
    .insert(payload)
    .select("id, patient_code, full_name, sex, dob, phone, email, address, created_at")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create patient: ${error?.message ?? "Unknown error"}`);
  }

  return data as PatientRow;
}
