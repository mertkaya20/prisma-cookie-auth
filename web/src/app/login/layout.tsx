import type { Metadata } from "next";

// Sayfa "use client" olduğu için başlık burada (metadata sadece server bileşenlerinden verilebilir).
export const metadata: Metadata = { title: "Log in" };

export default function Layout({ children }: LayoutProps<"/login">) {
  return children;
}
