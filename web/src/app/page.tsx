import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <h1 className="text-3xl font-semibold">TaskApp</h1>
      <p className="text-zinc-600">Ekibinle projelerini ve görevlerini yönet.</p>
      <div className="flex gap-3">
        <Link href="/login" className="rounded-md bg-zinc-900 px-4 py-2 text-white">
          Giriş yap
        </Link>
        <Link href="/register" className="rounded-md border border-zinc-300 px-4 py-2">
          Kayıt ol
        </Link>
      </div>
    </main>
  );
}
