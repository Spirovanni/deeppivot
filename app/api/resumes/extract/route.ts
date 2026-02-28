import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import pdfParse from "pdf-parse";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (file.type !== "application/pdf") {
            return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const data = await pdfParse(buffer);
        const text = data.text?.trim();

        if (!text) {
            return NextResponse.json({ error: "No text could be extracted from this PDF" }, { status: 422 });
        }

        return NextResponse.json({ text });
    } catch (error) {
        console.error("Resume PDF extraction error:", error);
        return NextResponse.json({ error: "Failed to extract text from PDF" }, { status: 500 });
    }
}
