import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/page-state";

// Geçici: Adım 7.6'da gerçek içerik gelecek.
export default function MyTasksPage() {
  return (
    <>
      <PageHeader
        title="My tasks"
        description="Tasks assigned to you, across all projects."
      />
      <EmptyState
        title="Coming next"
        description="This page is built in the next step."
      />
    </>
  );
}
