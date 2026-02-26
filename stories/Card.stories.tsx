import type { Meta, StoryObj } from "@storybook/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Star, DollarSign } from "lucide-react";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Base container component used throughout the dashboard. Composed from Card, CardHeader, CardTitle, CardContent, CardFooter primitives.",
      },
    },
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Card content goes here.</p>
      </CardContent>
    </Card>
  ),
};

export const StatCard: Story = {
  render: () => (
    <Card className="w-64">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
        <TrendingUp className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">1,284</p>
        <p className="text-xs text-muted-foreground mt-1">+12.5% from last month</p>
      </CardContent>
    </Card>
  ),
};

export const ProgramCard: Story = {
  render: () => (
    <Card className="w-72">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">General Assembly</p>
            <CardTitle className="text-sm mt-0.5">Software Engineering Bootcamp</CardTitle>
          </div>
          <Badge className="text-xs">Bootcamp</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <DollarSign className="size-3" />
            $14,950
          </span>
          <span className="flex items-center gap-1">
            <Star className="size-3 text-amber-500" />
            82 ROI
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          An immersive, project-based program covering full-stack development with JavaScript, React, Python, and SQL.
        </p>
        <Button variant="outline" size="sm" className="w-full">View program</Button>
      </CardContent>
    </Card>
  ),
};
