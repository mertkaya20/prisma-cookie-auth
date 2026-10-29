import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/page-state";

// Geçici: Adım 7.6'da gerçek içerik gelecek.
export default function TagsPage() {
  return (
    <>
      <PageHeader
        title="Tags"
        description="Labels your team uses to group tasks."
      />
      <EmptyState
        title="Coming next"
        description="This page is built in the next step."
      />
    </>
  );
}
