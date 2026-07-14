import { getIntervalsIcuRequestUrl } from "./urls";

export { getIntervalsIcuRequestUrl } from "./urls";

export type IntervalsIcuFetchAdapter = {
  fetch: (path: string, init: RequestInit) => Promise<Response>;
};

export type IntervalsIcuHttpClientService = IntervalsIcuFetchAdapter;

export const intervalsIcuFetchAdapter: IntervalsIcuFetchAdapter = {
  fetch: (path, init) => fetch(getIntervalsIcuRequestUrl(path), init),
};
