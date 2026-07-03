import type { PropsWithChildren } from "react";
import { ToastViewport } from "@/components/ui/Toast";
import { useStorageHydrationWarnings } from "@/lib/storage";

export function App({ children }: PropsWithChildren) {
  useStorageHydrationWarnings();

  return (
    <>
      {children}
      <ToastViewport />
    </>
  );
}
