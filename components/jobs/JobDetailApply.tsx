"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApplyModal } from "./ApplyModal";

interface JobDetailApplyProps {
  jobId: number;
  jobTitle: string;
  companyName: string;
  boardId: number;
}

export function JobDetailApply({ jobId, jobTitle, companyName, boardId }: JobDetailApplyProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Apply Now
      </button>

      {showModal && (
        <ApplyModal
          jobId={jobId}
          jobTitle={jobTitle}
          companyName={companyName}
          boardId={boardId}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
