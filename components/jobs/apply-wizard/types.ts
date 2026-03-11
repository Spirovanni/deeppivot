export interface WizardState {
  step: 1 | 2 | 3;
  // Step 1
  resumeMode: "select" | "manual" | "skip";
  selectedResumeId: number | null;
  manualResumeUrl: string;
  // Step 2
  coverLetterMode: "select" | "manual" | "skip";
  selectedCoverLetterId: number | null;
  manualCoverLetter: string;
}

export interface ResumeOption {
  id: number;
  title: string;
  fileUrl: string | null;
  status: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CoverLetterOption {
  id: number;
  content: string;
  tone: string;
  status: string;
  createdAt: string;
  jobDescriptionId: number;
  jobTitle: string;
  jobCompany: string | null;
  isRelevant: boolean;
}

export const INITIAL_STATE: WizardState = {
  step: 1,
  resumeMode: "skip",
  selectedResumeId: null,
  manualResumeUrl: "",
  coverLetterMode: "skip",
  selectedCoverLetterId: null,
  manualCoverLetter: "",
};
