"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ApplyWizard } from "./apply-wizard/ApplyWizard";

interface ApplyModalProps {
  jobId: number;
  jobTitle: string;
  companyName: string;
  boardId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApplyModal({ jobId, jobTitle, companyName, boardId, onClose, onSuccess }: ApplyModalProps) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[540px]" showCloseButton={false}>
        <ApplyWizard
          jobId={jobId}
          jobTitle={jobTitle}
          companyName={companyName}
          boardId={boardId}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
