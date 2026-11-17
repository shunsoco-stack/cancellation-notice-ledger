import { DetailView } from "@/components/detail-view";
export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DetailView id={id} />;
}
