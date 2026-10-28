import { redirect } from "next/navigation";

// /app'in kendi içeriği yok; giriş yapan kullanıcı projelerle başlar.
export default function AppIndex() {
  redirect("/app/projects");
}
