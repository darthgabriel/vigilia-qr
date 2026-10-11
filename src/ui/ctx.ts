import type { AppState } from "../../shared/types";

export interface Ctx {
  state: AppState;
  refresh: () => Promise<void>;
}
