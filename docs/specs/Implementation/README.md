# Implementation — Developer Integration & Acceptance Guide

Place the following files in this folder:

| File | Description |
|------|-------------|
| `08_Developer_Integration_and_Acceptance_Guide_v3.pdf` | UAT list MAST-UAT-01 to 30, integration UAT-01 to 30, CI/CD gates |
| `08_Developer_Integration_and_Acceptance_Guide_v3.docx` | Editable version of the above |

## What the Agent Implements from This Folder

- Automated test for EVERY row of MAST-UAT-01 to 30 (per wave)
- Automated test for EVERY row of UAT-01 to 30 (per wave)
- Negative-case tests alongside every positive test
- Pre-commit hooks, lint gates, security checks
- CI pipeline definition
- Wave completion criteria (all relevant UAT rows green + demo with sample records)

> **Drop your PDFs here. The agent reads this guide before declaring any wave complete.**
