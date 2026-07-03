import { create } from "zustand";
import { createId } from "@/lib/ids";

export type ToastTone = "info" | "success" | "warning" | "error";

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastStore = {
  items: ToastItem[];
  push: (toast: Omit<ToastItem, "id">) => string;
  remove: (id: string) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  items: [],
  push: (toast) => {
    const id = createId();
    set((state) => ({
      items: [...state.items, { ...toast, id }],
    }));
    return id;
  },
  remove: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
}));

export function showToast(toast: Omit<ToastItem, "id">) {
  return useToastStore.getState().push(toast);
}
