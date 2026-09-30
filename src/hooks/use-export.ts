import { useCallback, useMemo } from "react";
import { useSquint } from "@/lib/store";
import { recordExport } from "@/lib/counter";
import {
  canCopyImages, canShareFiles, copyPng, saveBlob, sceneToPngBlob, sceneToSvgBlob, shareBlob,
} from "@/lib/exporter";
import { useToast } from "@/components/toast";
import type { CodeState } from "./use-code";

export function useExport(code: CodeState) {
  const pngSize = useSquint((s) => s.pngSize);
  const type = useSquint((s) => s.type);
  const setCount = useSquint((s) => s.setCount);
  const toast = useToast((s) => s.show);

  const ability = useMemo(() => ({ share: canShareFiles(), copy: canCopyImages() }), []);

  const ready = useCallback(() => {
    if (code.error) {
      toast("Fix the error first.");
      return false;
    }
    if (code.isEmpty) {
      toast("Type something first.");
      return false;
    }
    return true;
  }, [code.error, code.isEmpty, toast]);

  const count = useCallback(() => {
    recordExport(code.payload).then(({ codes, people }) => {
      if (codes !== null) setCount("codes", codes);
      if (people !== null) setCount("people", people);
    });
  }, [code.payload, setCount]);

  const filename = (ext: string) => `squint-${type}.${ext}`;

  const downloadPng = useCallback(async () => {
    if (!ready()) return;
    try {
      saveBlob(await sceneToPngBlob(code.scene, pngSize), filename("png"));
      count();
      toast("Saved. Scan it once before you print it.");
    } catch {
      toast("Couldn't make the PNG. Try the SVG instead.");
    }
  }, [ready, code.scene, pngSize, count, toast, type]);

  const downloadSvg = useCallback(() => {
    if (!ready()) return;
    saveBlob(sceneToSvgBlob(code.scene), filename("svg"));
    count();
    toast("SVG saved. It stays sharp at any size.");
  }, [ready, code.scene, count, toast, type]);

  const share = useCallback(async () => {
    if (!ready()) return;
    try {
      const result = await shareBlob(await sceneToPngBlob(code.scene, pngSize), filename("png"));
      if (result === "shared") count();
    } catch {
      toast("Sharing didn't work here. Try Download instead.");
    }
  }, [ready, code.scene, pngSize, count, toast, type]);

  const copy = useCallback(async () => {
    if (!ready()) return;
    try {
      await copyPng(sceneToPngBlob(code.scene, pngSize));
      count();
      toast("Copied. Paste it anywhere.");
    } catch {
      toast("Copy didn't work here. Download it instead.");
    }
  }, [ready, code.scene, pngSize, count, toast]);

  return { downloadPng, downloadSvg, share, copy, canShare: ability.share, canCopy: ability.copy };
}
