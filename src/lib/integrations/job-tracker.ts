import type { IntegrationConfig } from "./types";

export const jobTrackerIntegration: IntegrationConfig = {
  provider: "job_tracker",
  displayName: "Job Tracker",
  description: "Add a job application to your Kanban board",
  icon: "briefcase",
  category: "productivity",
  configFields: [
    {
      key: "boardId",
      label: "Board",
      type: "select",
      required: true,
      placeholder: "Select a board",
      options: [], // Populated dynamically from user's boards at runtime
    },
    {
      key: "columnId",
      label: "Target Column",
      type: "select",
      required: true,
      placeholder: "Select target column",
      options: [], // Populated dynamically from the selected board's columns
    },
    {
      key: "company",
      label: "Company Name",
      type: "text",
      required: true,
      placeholder: "{{gmail.company}}",
    },
    {
      key: "position",
      label: "Position",
      type: "text",
      required: true,
      placeholder: "{{gmail.subject}}",
    },
    {
      key: "location",
      label: "Location",
      type: "text",
      required: false,
      placeholder: "{{gmail.location}}",
    },
    {
      key: "salary",
      label: "Salary",
      type: "text",
      required: false,
      placeholder: "{{parsed.salary}}",
    },
    {
      key: "jobUrl",
      label: "Job URL",
      type: "text",
      required: false,
      placeholder: "{{gmail.link}}",
    },
    {
      key: "tags",
      label: "Tags",
      type: "text",
      required: false,
      placeholder: "remote, frontend, react",
    },
  ],
};
