import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Styled form input field. Supports all native HTML input attributes.",
      },
    },
  },
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "search", "url", "number"],
    },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: "Enter text…" },
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-1.5 w-64">
      <Label htmlFor="email">Email address</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const Search_: Story = {
  name: "Search",
  render: () => (
    <div className="relative w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input type="search" placeholder="Search programs…" className="pl-9" />
    </div>
  ),
};

export const Disabled: Story = {
  args: { placeholder: "Disabled field", disabled: true, value: "Can't edit this" },
};

export const Password: Story = {
  args: { type: "password", placeholder: "Enter password…" },
};
