import { cookies } from "next/headers";
import { getWorkspace } from "@/lib/workspace";
import Workspace from "@/components/workspace";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";
export default async function HomePage() {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value || cookieStore.get("bss_demo_user")?.value;
  const authenticatedUserId = verifySessionToken(rawCookie);
  const data = await getWorkspace(authenticatedUserId || undefined);
  return <Workspace initialData={data} />;
}
