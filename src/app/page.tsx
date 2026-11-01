import { cookies } from "next/headers";
import { getWorkspace } from "@/lib/workspace";
import Workspace from "@/components/workspace";

export const dynamic = "force-dynamic";
export default async function HomePage() {
  const cookieStore = await cookies();
  const data = await getWorkspace(cookieStore.get("bss_demo_user")?.value);
  return <Workspace initialData={data} />;
}
