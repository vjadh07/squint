import { createContext, useContext, type ReactNode } from "react";
import { useCode, PLACEHOLDER_PAYLOAD, type CodeState } from "./use-code";
import { useTestScan, type ScanState } from "./use-test-scan";

type Ctx = { code: CodeState; scan: ScanState };

const CodeContext = createContext<Ctx | null>(null);

// One code + one test scan for the whole page (hero and studio share it).
export function CodeProvider({ children }: { children: ReactNode }) {
  const code = useCode();
  const scan = useTestScan(code.scene, code.isEmpty ? PLACEHOLDER_PAYLOAD : code.payload);
  return <CodeContext.Provider value={{ code, scan }}>{children}</CodeContext.Provider>;
}

export function useCurrentCode(): Ctx {
  const ctx = useContext(CodeContext);
  if (!ctx) throw new Error("useCurrentCode must be used inside CodeProvider");
  return ctx;
}
