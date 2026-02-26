/**
 * Salesforce Integration Client
 *
 * Encapsulates all Salesforce API calls for the WDB partner integration.
 * Uses jsforce — a full-featured Salesforce API client for Node.js.
 *
 * Authentication: OAuth2 Username-Password flow (server-to-server).
 * Suitable for background jobs, server actions, and webhook handlers.
 *
 * Env vars (all required in production):
 *   SALESFORCE_LOGIN_URL       – e.g. https://login.salesforce.com or sandbox URL
 *   SALESFORCE_USERNAME        – API/integration user login
 *   SALESFORCE_PASSWORD        – API/integration user password + security token appended
 *   SALESFORCE_SECURITY_TOKEN  – Salesforce security token (appended to password in some flows)
 *   SALESFORCE_CLIENT_ID       – Connected App OAuth2 client ID (consumer key)
 *   SALESFORCE_CLIENT_SECRET   – Connected App OAuth2 client secret (consumer secret)
 *
 * Usage:
 *   const sf = await getSalesforceClient();
 *   const contacts = await sf.query("SELECT Id, Name, Email FROM Contact LIMIT 10");
 */

import "server-only";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SalesforceConfig {
  loginUrl: string;
  username: string;
  password: string;
  clientId: string;
  clientSecret: string;
}

export interface SalesforceContact {
  Id: string;
  Name: string;
  Email: string | null;
  Phone: string | null;
  Title: string | null;
  AccountName?: string | null;
}

export interface SalesforceAccount {
  Id: string;
  Name: string;
  Type: string | null;
  BillingCity: string | null;
  BillingState: string | null;
  Website: string | null;
}

export interface SalesforceOpportunity {
  Id: string;
  Name: string;
  StageName: string;
  CloseDate: string;
  Amount: number | null;
  AccountId: string | null;
  AccountName?: string | null;
}

export interface WDBReferral {
  /** DeepPivot learner clerk ID */
  learnerId: string;
  /** Learner full name */
  learnerName: string;
  /** Learner email */
  learnerEmail: string;
  /** Type of referral (job_opening | wdb_program | employer | general) */
  referralType: "job_opening" | "wdb_program" | "employer" | "general";
  /** Free-text description of the referral */
  notes: string;
  /** Salesforce Account/Employer ID being referred to (optional) */
  targetAccountId?: string;
  /** Mentor's Salesforce contact ID (optional) */
  mentorSfContactId?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

function getConfig(): SalesforceConfig {
  const loginUrl = process.env.SALESFORCE_LOGIN_URL ?? "https://login.salesforce.com";
  const username = process.env.SALESFORCE_USERNAME;
  const password = process.env.SALESFORCE_PASSWORD;
  const securityToken = process.env.SALESFORCE_SECURITY_TOKEN ?? "";
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;

  if (!username || !password || !clientId || !clientSecret) {
    throw new Error(
      "Salesforce integration requires SALESFORCE_USERNAME, SALESFORCE_PASSWORD, " +
      "SALESFORCE_CLIENT_ID, and SALESFORCE_CLIENT_SECRET environment variables."
    );
  }

  return {
    loginUrl,
    username,
    // Security token is appended directly to password in username-password OAuth flow
    password: `${password}${securityToken}`,
    clientId,
    clientSecret,
  };
}

// ─── Client singleton ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _connection: any | null = null;

/**
 * Get (or lazily create) an authenticated jsforce Connection.
 * Re-uses the same connection across calls within the same Node.js process.
 */
export async function getSalesforceClient() {
  if (_connection) return _connection;

  const config = getConfig();

  // Dynamic import so jsforce is only loaded when actually needed
  const jsforce = await import("jsforce");

  const conn = new jsforce.Connection({
    oauth2: {
      loginUrl: config.loginUrl,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    },
  });

  await conn.login(config.username, config.password);

  _connection = conn;
  return conn;
}

// ─── Contact operations ───────────────────────────────────────────────────────

/**
 * Find a Salesforce Contact by email address.
 * Returns null if not found.
 */
export async function findContactByEmail(
  email: string
): Promise<SalesforceContact | null> {
  const conn = await getSalesforceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (conn.query as (soql: string) => Promise<{ records: SalesforceContact[] }>)(
    `SELECT Id, Name, Email, Phone, Title, Account.Name FROM Contact WHERE Email = '${email.replace(/'/g, "\\'")}' LIMIT 1`
  );
  return result.records[0] ?? null;
}

/**
 * Create or update a Salesforce Contact for a DeepPivot learner.
 * Uses upsert on the Email field (assumed to be an External ID or unique).
 */
export async function upsertLearnerContact(learner: {
  email: string;
  firstName: string;
  lastName: string;
  deepPivotUserId?: string;
}): Promise<string> {
  const conn = await getSalesforceClient();

  const existing = await findContactByEmail(learner.email);

  if (existing) {
    await conn.sobject("Contact").update({
      Id: existing.Id,
      FirstName: learner.firstName,
      LastName: learner.lastName,
      DeepPivot_User_ID__c: learner.deepPivotUserId ?? null,
    });
    return existing.Id;
  }

  const result = await conn.sobject("Contact").create({
    FirstName: learner.firstName,
    LastName: learner.lastName,
    Email: learner.email,
    LeadSource: "DeepPivot",
    DeepPivot_User_ID__c: learner.deepPivotUserId ?? null,
  });

  if (!result.success || !result.id) {
    throw new Error(`Failed to create Salesforce Contact: ${JSON.stringify(result.errors)}`);
  }

  return result.id;
}

// ─── Account / Employer operations ───────────────────────────────────────────

/**
 * Search Salesforce Accounts by name (for employer partner lookup).
 */
export async function searchAccounts(query: string, limit = 10): Promise<SalesforceAccount[]> {
  const conn = await getSalesforceClient();
  const safe = query.replace(/'/g, "\\'");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (conn.query as (soql: string) => Promise<{ records: SalesforceAccount[] }>)(
    `SELECT Id, Name, Type, BillingCity, BillingState, Website FROM Account WHERE Name LIKE '%${safe}%' LIMIT ${limit}`
  );
  return result.records;
}

// ─── Opportunity / Referral operations ───────────────────────────────────────

/**
 * Log a WDB referral as a Salesforce Opportunity (or Task, depending on org config).
 * Creates an Opportunity linked to the target Account with the learner as a Contact Role.
 */
export async function createReferralOpportunity(referral: WDBReferral): Promise<string> {
  const conn = await getSalesforceClient();

  const oppResult = await conn.sobject("Opportunity").create({
    Name: `DeepPivot Referral — ${referral.learnerName} — ${referral.referralType}`,
    StageName: "Prospecting",
    CloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    AccountId: referral.targetAccountId ?? null,
    Description: [
      `Learner: ${referral.learnerName} (${referral.learnerEmail})`,
      `Learner ID: ${referral.learnerId}`,
      `Referral type: ${referral.referralType}`,
      `Notes: ${referral.notes}`,
    ].join("\n"),
    LeadSource: "DeepPivot",
  });

  if (!oppResult.success || !oppResult.id) {
    throw new Error(`Failed to create Salesforce Opportunity: ${JSON.stringify(oppResult.errors)}`);
  }

  return oppResult.id;
}

/**
 * Log a referral as a Salesforce Activity / Task (lighter-weight alternative to Opportunity).
 */
export async function createReferralTask(referral: WDBReferral): Promise<string> {
  const conn = await getSalesforceClient();

  const taskResult = await conn.sobject("Task").create({
    Subject: `DeepPivot Referral: ${referral.referralType} — ${referral.learnerName}`,
    Status: "Not Started",
    Priority: "Normal",
    Description: [
      `Learner: ${referral.learnerName} (${referral.learnerEmail})`,
      `Learner ID: ${referral.learnerId}`,
      `Referral type: ${referral.referralType}`,
      `Notes: ${referral.notes}`,
    ].join("\n"),
    WhatId: referral.targetAccountId ?? undefined,
    WhoId: referral.mentorSfContactId ?? undefined,
    ActivityDate: new Date().toISOString().split("T")[0],
  });

  if (!taskResult.success || !taskResult.id) {
    throw new Error(`Failed to create Salesforce Task: ${JSON.stringify(taskResult.errors)}`);
  }

  return taskResult.id;
}

// ─── Generic query helper ─────────────────────────────────────────────────────

/**
 * Execute an arbitrary SOQL query.
 * Use for one-off or admin queries — prefer typed helpers above for application use.
 */
export async function soqlQuery<T = Record<string, unknown>>(soql: string): Promise<T[]> {
  const conn = await getSalesforceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (conn.query as (soql: string) => Promise<{ records: T[] }>)(soql);
  return result.records;
}

// ─── Health check ─────────────────────────────────────────────────────────────

/**
 * Verify Salesforce connectivity by fetching org limits.
 * Returns true if the connection is healthy.
 */
export async function checkSalesforceConnection(): Promise<boolean> {
  try {
    const conn = await getSalesforceClient();
    await conn.limits();
    return true;
  } catch {
    return false;
  }
}
