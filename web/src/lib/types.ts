// API cevaplarının şekli. API'deki userSelect ile aynı tutulmalı.
export type User = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "member";
  organizationId: string;
};
