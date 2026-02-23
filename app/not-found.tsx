import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="size-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Head back to the homepage to find what you need.
          </p>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 size-4" />
              Go to homepage
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
