# PostHog KPI Dashboard Setup Guide

This guide walks you through the manual process of setting up the required Key Performance Indicator (KPI) dashboard in PostHog for DeepPivot.

**Target KPIs:**
1.  **75% Interview Completion Rate:** Tracking the percentage of users who start an interview and complete it.
2.  **60% Plan Activation Rate:** Tracking the percentage of users who generate a career plan and then take an action on it (e.g., save it, apply to a job from it).
3.  **30% WDB Connection Rate:** Tracking the percentage of eligible users who successfully connect with a Workforce Development Board (WDB).

---

## Prerequisites

Before building the dashboards, ensure your application is firing these core events (or similar naming structures based on your implementation):

*   `interview_started`
*   `interview_completed`
*   `plan_generated`
*   `plan_activated` (e.g., plan saved, job applied from plan)
*   `wdb_eligibility_viewed`
*   `wdb_connection_initiated`
*   `wdb_connection_successful`

*(If your event names differ, substitute them in the steps below).*

---

## 1. Create a New Dashboard

1.  Log in to your **PostHog** account.
2.  On the left sidebar, click on **Dashboards**.
3.  Click the **New dashboard** button in the top right.
4.  Select **Blank dashboard**.
5.  Name the dashboard: **"DeepPivot Core KPIs"**.
6.  (Optional) Add a description: *"Tracking primary product metrics: Interview Completion, Plan Activation, WDB Connection."*

---

## 2. Setting Up the "Interview Completion Rate" Insight

This will be a **Funnel** insight to see the drop-off between starting and completing an interview.

1.  Open your new "DeepPivot Core KPIs" dashboard.
2.  Click **Add insight**.
3.  Select the **Funnels** tab at the top.
4.  **Step 1:** In the "Events" section, select your starting event: `interview_started`.
5.  **Step 2:** Click "+ Add step" and select your ending event: `interview_completed`.
6.  **Options:**
    *   Change the date range (top right) to your preferred viewing window (e.g., "Last 30 days").
    *   Under the graph, you will see the conversion rate percentage. Your goal is for this number to be **> 75%**.
7.  **Save:** Click the "Save & add to dashboard" button in the top right. Note: Make sure the title at the top says "Interview Completion Funnel".

---

## 3. Setting Up the "Plan Activation Rate" Insight

This will also be a **Funnel** insight to track users moving from receiving a plan to activating it.

1.  On the dashboard, click **Add insight** again.
2.  Select the **Funnels** tab.
3.  **Step 1:** Select the event: `plan_generated`.
4.  **Step 2:** Click "+ Add step" and select the event: `plan_activated`.
5.  **Options:**
    *   Adjust the date range if needed.
    *   Keep an eye on the conversion rate in the visualization. Your goal is **> 60%**.
6.  **Save:** Click the title at the top and rename it to "Plan Activation Funnel", then click "Save & add to dashboard".

---

## 4. Setting Up the "WDB Connection Rate" Insight

This is a **Funnel** insight tracking the flow from viewing eligibility to successfully connecting.

1.  On the dashboard, click **Add insight**.
2.  Select the **Funnels** tab.
3.  **Step 1:** Select the event: `wdb_eligibility_viewed`.
4.  **Step 2 (Optional but recommended):** Click "+ Add step" and select `wdb_connection_initiated`.
5.  **Step 3:** Click "+ Add step" and select `wdb_connection_successful`.
6.  **Options:**
    *   Your goal is for the overall conversion from Step 1 to the final step to be **> 30%**.
7.  **Save:** Rename the insight to "WDB Connection Funnel" and click "Save & add to dashboard".

---

## 5. (Bonus) Setting Up Metric "Number" Widgets

Funnels are great for visualizing drop-off, but sometimes you just want to see the pure conversion rate percentage as a single number on your dashboard.

PostHog allows you to create formula-based Number insights:

1.  Click **Add insight** on your dashboard.
2.  Select the **Trends** tab.
3.  Change the visualization type (dropdown near the top left, usually defaults to 'Line chart') to **Number**.
4.  **A:** Select your completed event (e.g., `interview_completed`). Change "Total count" to "Unique users".
5.  **B:** Click "+ Add graph series" and select your started event (e.g., `interview_started`). Change "Total count" to "Unique users".
6.  **Formula:** Click the "Enable formula" toggle (usually below the series inputs).
7.  Enter the formula: `(A / B) * 100`
8.  This will output the percentage as a single large number.
9.  Save the insight as "Interview Completion %".
10. Repeat for the other two KPIs.

---

## 6. Review and Organize

*   You should now have 3 (or up to 6, if you added the number blocks) widgets on your "DeepPivot Core KPIs" dashboard.
*   You can drag and drop them to organize the layout. A good structure is having the big percentage numbers at the top, and the detailed funnels below them.
*   This Dashboard will now automatically populate as traffic flows through those specific events in the app.
