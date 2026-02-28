export type JobDescription = {
    id: number;
    title: string;
    company: string | null;
    content: string;
    url: string | null;
    status: "pending" | "extracted" | "failed" | null;
    extractedData: any;
    createdAt: Date;
    updatedAt: Date;
};
