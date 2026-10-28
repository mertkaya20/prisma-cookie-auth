import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

// Oturum kontrol edilirken: kabuk henüz yok, sadece logo.
export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status">
      <Logo className="animate-pulse text-ink-muted" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

// Oturum kontrolü 401 dışında bir sebeple başarısız olursa (API kapalı, sunucu hatası).
export function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo />
      <p className="max-w-sm text-ink-muted">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

// Henüz içeriği olmayan bir liste: ne yapılacağını söyler.
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line px-6 py-14 text-center">
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
