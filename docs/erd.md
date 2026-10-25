# MBMS Entity Relationship Diagram — Module 1

> Generated from `apps/api/prisma/schema.prisma` — Step 2.
> Last updated: 2026-10-25

```mermaid
erDiagram
    ProjectSequence {
        int id PK
        int year
        string prefix
        int counter
    }

    User {
        uuid id PK
        string name
        string email UK
        string passwordHash
        UserRole role
        boolean isActive
        datetime lastLoginAt
        int failedAttempts
        datetime lockedUntil
    }

    Contact {
        uuid id PK
        string fullName
        string organisation
        string primaryPhone
        string alternatePhone
        string email
        boolean consentMarketing
        boolean consentDataProc
        SourceChannel sourceChannel
        string externalId
    }

    Conversation {
        uuid id PK
        uuid contactId FK
        uuid assignedStaffId FK
        SourceChannel channel
        string externalThreadId UK
        ConversationStatus status
        string subject
        datetime followUpAt
        datetime lastActivityAt
        uuid linkedProjectId FK
    }

    Message {
        uuid id PK
        uuid conversationId FK
        uuid authorId FK
        string content
        boolean isNote
        string externalMsgId
        datetime sentAt
    }

    WebhookEvent {
        uuid id PK
        SourceChannel channel
        string externalId UK
        json payload
        boolean processed
    }

    Project {
        uuid id PK
        string reference UK
        uuid contactId FK
        string projectType
        string siteCounty
        string siteArea
        string siteDirections
        ProjectStage currentStage
        uuid createdFromConversationId
    }

    VisitBooking {
        uuid id PK
        uuid projectId FK_UK
        datetime scheduledAt
        uuid assignedOfficerId FK
        decimal visitFeeKes
        PaymentStatus paymentStatus
        BookingStatus status
        string idempotencyKey UK
        uuid bookedById FK
        datetime checkInAt
        json checkInGps
        datetime checkOutAt
        json checkOutGps
    }

    BookingHistory {
        uuid id PK
        uuid bookingId FK
        datetime oldScheduledAt
        datetime newScheduledAt
        BookingStatus oldStatus
        BookingStatus newStatus
        string reason
        string changedById
    }

    SiteSurvey {
        uuid id PK
        uuid bookingId FK
        uuid capturedById FK
        int version
        SurveyStatus status
        string schemaVersion
        uuid previousVersionId
        json sectionA
        json sectionB
        json sectionC
        json sectionD
        json sectionE
        json sectionF
        json sectionG
        datetime lockedAt
        datetime submittedAt
    }

    SurveyMedia {
        uuid id PK
        uuid surveyId FK
        MediaKind kind
        string category
        string caption
        string storageKey
        string previewKey
        string checksum
        string mimeType
        bigint sizeBytes
        string idempotencyKey UK
    }

    SketchVersion {
        uuid id PK
        uuid surveyId FK
        json strokesJson
        string renderedKey
        int version
        string label
        datetime editedAt
        string editedById
    }

    ReportVersion {
        uuid id PK
        uuid surveyId FK
        int versionNumber
        string docxKey
        string pdfKey
        ReportGeneratorStatus generatorStatus
        ReportApprovalState approvalState
        uuid approvedById FK
        datetime approvedAt
    }

    Review {
        uuid id PK
        uuid reportVersionId FK
        uuid reviewerId FK
        ReviewDecision decision
        string comments
    }

    JuniorAssignment {
        uuid id PK
        uuid projectId FK
        uuid reportVersionId FK
        uuid juniorArchitectId FK
        uuid assignedById FK
        datetime dueDate
        Priority priority
        string instructions
    }

    PortalPublication {
        uuid id PK
        uuid reportVersionId FK
        uuid publishedById FK
        datetime publishedAt
        datetime revokedAt
        uuid revokedById FK
        string revokeReason
        uuid supersededById FK
    }

    Notification {
        uuid id PK
        uuid recipientId FK
        NotificationEvent event
        string entityType
        string entityId
        string title
        string body
        NotificationChannel channel
        DeliveryStatus deliveryStatus
        datetime readAt
    }

    AuditEvent {
        uuid id PK
        uuid actorId FK
        string action
        string entityType
        string entityId
        uuid projectId FK
        json before
        json after
        string reason
        string ipAddress
        datetime createdAt
    }

    %% Relationships
    Contact ||--o{ Conversation : "has"
    Contact ||--o{ Project : "has"

    User ||--o{ Conversation : "assigned to"
    Conversation ||--o{ Message : "contains"
    Conversation }o--o| Project : "linked to"

    Project ||--o| VisitBooking : "has exactly one"
    Project ||--o{ JuniorAssignment : "has"
    Project ||--o{ AuditEvent : "has"

    VisitBooking ||--o{ BookingHistory : "history"
    VisitBooking ||--o{ SiteSurvey : "generates"

    User ||--o{ VisitBooking : "books"
    User ||--o{ VisitBooking : "assigned as officer"

    SiteSurvey ||--o{ SurveyMedia : "has"
    SiteSurvey ||--o{ SketchVersion : "has"
    SiteSurvey ||--o{ ReportVersion : "generates"

    ReportVersion ||--o{ Review : "has"
    ReportVersion ||--o{ JuniorAssignment : "referenced by"
    ReportVersion ||--o{ PortalPublication : "published as"

    PortalPublication }o--o{ SurveyMedia : "permits"
    PortalPublication }o--o| PortalPublication : "superseded by"

    User ||--o{ AuditEvent : "actor"
    User ||--o{ Notification : "receives"
    User ||--o{ Review : "writes"
    User ||--o{ JuniorAssignment : "assigned as junior"
    User ||--o{ JuniorAssignment : "makes assignment"
    User ||--o{ PortalPublication : "publishes"
```

## Key constraints

| Rule | Enforcement |
|------|-------------|
| One booking per project | `VisitBooking.projectId` is `@unique` |
| No duplicate bookings on retry | `VisitBooking.idempotencyKey` is `@unique` |
| No duplicate file uploads on retry | `SurveyMedia.idempotencyKey` is `@unique` |
| Audit events are immutable | PostgreSQL trigger blocks `UPDATE`/`DELETE` |
| Submitted surveys are immutable | PostgreSQL trigger blocks `UPDATE` when `lockedAt IS NOT NULL` |
| Report deduplication | `@@unique([surveyId, versionNumber])` |
| Survey version deduplication | `@@unique([bookingId, version])` |
| External channel dedup | `@@unique([externalThreadId, channel])` on Conversation |
| External webhook dedup | `@@unique([channel, externalId])` on WebhookEvent |

## Business rules encoded in schema

1. **Enquiry ≠ Project** — Project is only created transactionally with a VisitBooking
2. **Approved versions immutable** — `ReportApprovalState.APPROVED` is terminal; a trigger prevents edits to locked surveys
3. **Separate actions** — Approval (`Review`), Assignment (`JuniorAssignment`), Publication (`PortalPublication`) are all separate tables
4. **History never deleted** — All `onDelete` on history/audit tables use `Restrict`
5. **Client sees only published** — `PortalPublication` controls exactly which `SurveyMedia` IDs are visible
