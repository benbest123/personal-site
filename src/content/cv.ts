import type { CvData } from "./types";

export const cv: CvData = {
  roles: [
    {
      company: "Visa",
      title: "Associate Data Engineer",
      start: "May 2024",
      end: "Jun 2026",
      bullets: [
        "As feature lead, designed and delivered an AWS data pipeline that produces monthly billing and reporting data for 8 banking partners, using AWS Glue (PySpark) for the ETL and AWS CDK (TypeScript) to provision separate S3 buckets, Glue jobs, KMS keys and IAM roles for each partner.",
        "Recreated a legacy black-box billing process as a transparent Spark SQL pipeline over a cloud data warehouse, aggregating transaction-level payment data into per-company monthly metrics with currency conversion and change-data-capture deduplication.",
        "Built the Qlik-embedding layer (iframe orchestration and cross-frame communication) of a React and Node.js analytics microsite, migrating around 25 dashboards onto a compliant Content Security Policy.",
        "Independently maintained the Qlik dashboards and Qlik infrastructure through a five-week absence of the team's senior engineer that coincided with a company-wide on-premise-to-cloud migration, resolving configuration and infrastructure issues alongside the operations team.",
        "Developed a reliable load-completion detection mechanism for third-party dashboards that exposed no official data-ready API, and debugged a data race condition in the async provisioning flow, iterating from polling to a timestamp-based heuristic.",
        "Delivered SQL Server stored procedures and end-to-end Google Analytics instrumentation (per-partner enablement, server-side initialisation, security-header updates, and form event capture) across a multi-tenant .NET monolith.",
      ],
    },
    {
      company: "Russell McVeagh",
      title: "Business Intelligence Analyst",
      start: "Jun 2022",
      end: "Aug 2023",
      bullets: [
        "Owned the firm's business-intelligence reporting, delivering revenue, client-activity and time-allocation reporting to senior stakeholders.",
        "Created self-service Power BI dashboards, end to end, for the firm's ~300 lawyers, replacing legacy SSRS reports and eliminating the recurring ad-hoc requests that previously required manual SQL extracts.",
      ],
    },
    {
      company: "Technology Investment Network",
      title: "Research Analyst",
      start: "Nov 2021",
      end: "Jun 2022",
      bullets: [
        "Automated the data-collection process with Python, replacing legacy Excel queries and manual data entry.",
        "Produced the data analysis and written content that fed the organisation's published reports on the New Zealand technology sector.",
      ],
    },
  ],
  education: [
    {
      institution: "University of Auckland",
      qualification: "BEng (Hons), Engineering Science",
      start: "Feb 2018",
      end: "Nov 2021",
      detail:
        "First Class Honours. Relevant coursework: programming (Python, MATLAB), statistics, machine learning, and optimisation.",
    },
  ],
  certificates: [
    {
      name: "AWS Certified AI Practitioner (AIF-C01)",
      issuer: "Amazon Web Services",
      year: "2025",
    },
  ],
  skillGroups: [
    { name: "Languages", skills: ["Python", "TypeScript", "JavaScript", "SQL"] },
    { name: "Frontend", skills: ["React", "HTML/CSS", "Tailwind CSS"] },
    {
      name: "Backend & Data",
      skills: [
        "Node.js",
        "Express.js",
        "PostgreSQL",
        "SQL Server (T-SQL)",
        "Stored Procedures",
        "PySpark",
        "REST APIs",
        "ETL",
        "Data Warehousing",
      ],
    },
    {
      name: "Cloud & DevOps",
      skills: [
        "AWS (Glue, CDK, S3, CloudFormation, IAM, CodePipeline, Athena, KMS)",
        "Git",
        "GitHub Actions",
        "CI/CD",
        "Infrastructure as Code",
      ],
    },
    { name: "BI & Reporting", skills: ["Power BI", "Qlik", "SSRS"] },
    {
      name: "Practices",
      skills: ["Agile", "Unit Testing (Jest, pytest)", "Accessibility"],
    },
  ],
};
