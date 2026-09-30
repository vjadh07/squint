import { ModuleWordmark } from "@/components/module-wordmark";

export function Footer() {
  return (
    <footer className="border-t border-line-soft pb-[max(24px,env(safe-area-inset-bottom))]">
      <div className="gutter mx-auto max-w-[1320px] pt-14">
        <ModuleWordmark />
        <div className="mt-10 flex flex-col gap-3 text-sm text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Made by{" "}
            <a className="text-ink-2 underline decoration-line underline-offset-4 hover:text-ink" href="https://github.com/vjadh07">
              Viraj Jadhav
            </a>
            . Open source on{" "}
            <a className="text-ink-2 underline decoration-line underline-offset-4 hover:text-ink" href="https://github.com/vjadh07/squint">
              GitHub
            </a>
            .
          </p>
          <p>QR Code is a registered trademark of DENSO WAVE.</p>
        </div>
      </div>
    </footer>
  );
}
