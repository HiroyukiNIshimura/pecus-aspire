import { useSession } from "next-auth/react";
import { createPecusApiClients } from "../api/PecusApiClient";

export function useApiClient() {
  return createPecusApiClients();
}
