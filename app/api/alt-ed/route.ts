/**
 * GET /api/alt-ed
 *
 * Paginated, filterable Alt-Ed program search endpoint.
 *
 * Query params:
 *   q           – text search (name | provider | description | tags)
 *   type        – comma-separated program types (bootcamp,certification,…)
 *   maxCost     – max cost in dollars (integer; converted to cents internally)
 *   minRoi      – minimum ROI score (0–100)
 *   tags        – comma-separated tags to filter by (any match)
 *   sort        – roi-desc | cost-asc | cost-desc | name-asc (default: roi-desc)
 *   page        – page number, 1-indexed (default: 1)
 *   limit       – results per page, max 100 (default: 24)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { educationProgramsTable } from "@/src/db/schema";
import { and, eq, lte, gte, inArray, asc, desc, sql, ilike, or } from "drizzle-orm";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const q = searchParams.get("q")?.trim() ?? "";
    const types = searchParams.get("type")?.split(",").filter(Boolean) ?? [];
    const maxCostDollars = searchParams.get("maxCost");
    const minRoi = searchParams.get("minRoi");
    const tagFilter = searchParams.get("tags")?.split(",").filter(Boolean) ?? [];
    const sort = searchParams.get("sort") ?? "roi-desc";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions = [eq(educationProgramsTable.isActive, true)];

    if (types.length > 0) {
      conditions.push(inArray(educationProgramsTable.programType, types));
    }

    if (maxCostDollars !== null) {
      const maxCostCents = Math.round(parseFloat(maxCostDollars) * 100);
      if (!isNaN(maxCostCents)) {
        conditions.push(lte(educationProgramsTable.cost, maxCostCents));
      }
    }

    if (minRoi !== null) {
      const minRoiInt = parseInt(minRoi, 10);
      if (!isNaN(minRoiInt)) {
        conditions.push(gte(educationProgramsTable.roiScore, minRoiInt));
      }
    }

    if (tagFilter.length > 0) {
      // Any tag match — program must have at least one of the requested tags
      conditions.push(
        sql`${educationProgramsTable.tags} && ${tagFilter}`
      );
    }

    // Text search
    if (q) {
      conditions.push(
        or(
          ilike(educationProgramsTable.name, `%${q}%`),
          ilike(educationProgramsTable.provider, `%${q}%`),
          ilike(educationProgramsTable.description, `%${q}%`)
        )!
      );
    }

    const whereClause = and(...conditions);

    // Determine ORDER BY
    let orderBy;
    switch (sort) {
      case "cost-asc":
        orderBy = asc(educationProgramsTable.cost);
        break;
      case "cost-desc":
        orderBy = desc(educationProgramsTable.cost);
        break;
      case "name-asc":
        orderBy = asc(educationProgramsTable.name);
        break;
      case "roi-desc":
      default:
        orderBy = desc(educationProgramsTable.roiScore);
        break;
    }

    // Parallel count + data queries
    const [countResult, programs] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(educationProgramsTable)
        .where(whereClause),
      db
        .select()
        .from(educationProgramsTable)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: programs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("[GET /api/alt-ed] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch programs" },
      { status: 500 }
    );
  }
}
