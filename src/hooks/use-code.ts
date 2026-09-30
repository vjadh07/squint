import { useMemo, useRef } from "react";
import { useSquint } from "@/lib/store";
import { buildPayload } from "@/lib/payload";
import { encode, PayloadTooLongError, type Ecc } from "@/lib/qr";
import { buildScene, type Scene } from "@/lib/scene";

// Shown before anyone types: a real, scannable code for this site.
export const PLACEHOLDER_PAYLOAD = "https://vjadh07.github.io/squint/";

export type CodeState = {
  payload: string;
  isEmpty: boolean;
  scene: Scene;
  moduleCount: number;
  ecc: Ecc;
  error: string;
};

export function useCode(): CodeState {
  const type = useSquint((s) => s.type);
  const fields = useSquint((s) => s.fields[s.type]);
  const style = useSquint((s) => s.style);
  const chosenEcc = useSquint((s) => s.ecc);
  const lastGood = useRef<CodeState | null>(null);

  return useMemo(() => {
    const payload = buildPayload(type, fields as never);
    const isEmpty = !payload;
    const ecc: Ecc = style.logo ? "H" : chosenEcc;
    try {
      const matrix = encode(isEmpty ? PLACEHOLDER_PAYLOAD : payload, ecc);
      const state = { payload, isEmpty, scene: buildScene(matrix, style), moduleCount: matrix.length, ecc, error: "" };
      lastGood.current = state;
      return state;
    } catch (err) {
      const message = err instanceof PayloadTooLongError ? err.message : "Something went wrong making that code.";
      const fallback = lastGood.current ?? {
        payload: "", isEmpty: true, scene: buildScene(encode(PLACEHOLDER_PAYLOAD, "M"), style), moduleCount: 0, ecc,
      };
      return { ...fallback, payload, isEmpty, error: message };
    }
  }, [type, fields, style, chosenEcc]);
}
