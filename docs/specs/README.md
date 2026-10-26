# MBMS V3 Specification Pack (25 October 2026)

> **PRECEDENCE ORDER**
> 1. Applicable Kenyan law and signed contracts
> 2. Later user-confirmed rules
> 3. Module 7 and the Master Architecture (Architecture/00)
> 4. Each module's opening V3 addendum (governs how to read preserved source pages)
> 5. Preserved module pages
> 6. Agent design proposals

---

## Folder Layout

```
docs/specs/
├── Architecture/          ← Central standards, auth, audit, delegation engine
│   ├── 00_Master_System_Architecture_and_Governance_v3.pdf
│   └── 00_Master_System_Architecture_and_Governance_v3.docx
│
├── Implementation/        ← Developer integration, CI/CD gates, UAT acceptance list
│   ├── 08_Developer_Integration_and_Acceptance_Guide_v3.pdf
│   └── 08_Developer_Integration_and_Acceptance_Guide_v3.docx
│
└── Modules/               ← Functional modules 01–07
    ├── 01_Site_Visit_Governance_Aligned_v3.pdf
    ├── 02_Planning_Governance_Aligned_v3.pdf
    ├── 03_Client_Acceptance_Governance_Aligned_v3.pdf
    ├── 04_Approvals_Governance_Aligned_v3.pdf
    ├── 05_Contracts_Governance_Aligned_v3.pdf
    ├── 06_Construction_Governance_Aligned_v3.pdf
    ├── 07_Central_Administration_and_Governance_v3.pdf
    └── 07_Central_Administration_and_Governance_v3.docx
```

## Reading Order for the Agent

1. `Architecture/00` — Master Architecture & Governance (read in full before any code)
2. `Modules/07` — Central Administration & Governance (read in full before any code)
3. `Implementation/08` — Developer Integration & Acceptance Guide (read in full before any code)
4. `Modules/01` — Site Visit (read in full before Wave 1 begins)
5. `Modules/02–06` — read each module's V3 opening addendum before that module's wave

## V3 Key Changes (from user briefing, 2026-10-26)

- **V3 PDFs supersede all earlier versions.** Do not mix in older PDFs.
- **"Management" = delegated manager OR General Manager** for above-limit decisions. The owner is kept out of daily approvals.
- **Authority & delegation engine is mandatory** for every approval: category, role/person grant, project scope, value threshold, risk category, effective dates, evidence required, substitution/escalation route.
- **Modules 4–7 are in scope.** Module 7 runs continuously alongside all other modules.
- **Not every client buys everything.** Planning-only, approvals-only, labour-only and full-build paths must all work without forcing the full chain.
- **Construction stays locked** until permits, payments and safety checks clear.

## Mathmag Must Supply (before those sections build)

- Named office-holders for each role (GM, deputies, department heads)
- Approval value limits per authority category
- Signing mandates
- Statutory checklists (Kenyan building regulations)
- Payroll rules and NHIF/NSSF/PAYE rates (never hard-code)
