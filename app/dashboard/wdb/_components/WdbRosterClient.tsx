"use client";

import { useState } from "react";
import { type WdbLearnerRosterItem } from "@/src/lib/actions/wdb-analytics";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Props {
    roster: WdbLearnerRosterItem[];
}

export function WdbRosterClient({ roster }: Props) {
    const [search, setSearch] = useState("");

    const filtered = roster.filter((r) => {
        const term = search.toLowerCase();
        return (
            r.name.toLowerCase().includes(term) ||
            r.email.toLowerCase().includes(term) ||
            (r.wdbCasePlanId && r.wdbCasePlanId.toLowerCase().includes(term))
        );
    });

    const handleExportCsv = () => {
        const headers = [
            "Name",
            "Email",
            "WDB Case Plan ID",
            "Enrolled At",
            "Archetype",
            "Total Sessions",
            "Completed Sessions",
            "Milestones Planned",
            "Milestones Completed",
        ];

        const rows = filtered.map((r) => [
            r.name,
            r.email,
            r.wdbCasePlanId || "",
            r.wdbEnrolledAt ? new Date(r.wdbEnrolledAt).toLocaleDateString() : "",
            r.archetypeName || "Pending",
            r.totalSessions.toString(),
            r.completedSessions.toString(),
            r.milestonesTotal.toString(),
            r.milestonesCompleted.toString(),
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((row) => row.map(v => `"${v}"`).join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `wdb_learner_roster_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Learner Roster</CardTitle>
                <CardDescription>
                    Detailed progress for all learners connected to mentors in your partner network.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 justify-between pt-4">
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, or case ID..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={handleExportCsv} disabled={filtered.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Learner</TableHead>
                                <TableHead>WDB Info</TableHead>
                                <TableHead>Archetype</TableHead>
                                <TableHead className="text-right">Sessions</TableHead>
                                <TableHead className="text-right">Milestones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No learners found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-sm text-muted-foreground">{item.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            {item.wdbCasePlanId ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-medium">#{item.wdbCasePlanId}</span>
                                                    {item.wdbEnrolledAt && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(item.wdbEnrolledAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground italic">None</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {item.archetypeName ? (
                                                <Badge variant="secondary">{item.archetypeName}</Badge>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Pending</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="font-medium">{item.completedSessions} / {item.totalSessions}</span>
                                                <span className="text-xs text-muted-foreground">completed</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="font-medium">{item.milestonesCompleted} / {item.milestonesTotal}</span>
                                                <span className="text-xs text-muted-foreground">completed</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
