import { useSession } from "next-auth/react";
import { createPecusApiClients } from "../api/PecusApiClient";

export function useApiClient() {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;
  return token ? createPecusApiClients(token) : undefined;
}
