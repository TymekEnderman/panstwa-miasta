import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Anuluj",
  tone = "primary",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button fullWidth variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            fullWidth
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-6 text-slate-700">{description}</p>
    </Modal>
  );
}
