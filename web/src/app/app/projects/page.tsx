import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/page-state";

// Geçici: Adım 7.6'da gerçek içerik gelecek.
export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="Projects"
        description="Every project in your organization."
      />
      <EmptyState
        title="Coming next"
        description="This page is built in the next step."
      />
    </>
  );
}
