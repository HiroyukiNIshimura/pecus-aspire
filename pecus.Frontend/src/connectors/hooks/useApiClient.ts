import { createPecusApiClients } from "../api/PecusApiClient";

export function useApiClient() {
  return createPecusApiClients();
}
