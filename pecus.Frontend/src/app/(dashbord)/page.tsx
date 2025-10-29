import ResizableSidebar from "@/components/client/widgets/ResizableSidebar";
import { createPecusApiClients } from "@/connectors/api/PecusApiClient";

export default async function Dashboard() {
  const client = createPecusApiClients();
  const res = await client.adminUser.apiAdminUsersGet(); // 動作確認用

  return <ResizableSidebar />;
}
