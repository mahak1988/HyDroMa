# Frontend Forms, Input Validation and User Interaction Standards

| مشخصه | مقدار |
|---|---|
| Document ID | EN-FE-036 |
| Document Title | Frontend Forms, Input Validation and User Interaction Standards |
| Version | 0.1.0 |
| Status | DRAFT — PROPOSED — NOT APPROVED |
| Implementation Status | NOT VERIFIED |
| Architecture Decision Status | OPEN |
| Scope | Eco Nojin, HyDroMA, Nojin Marketplace |
| Document Type | Frontend Engineering Standard |
| Language | English |
| Owner | Eco Nojin Product and Architecture Governance |
| Related Standards | State Management, Routing, Accessibility, Security, Testing, i18n, Performance |

---

# 1. Purpose

This document defines proposed engineering standards for designing, implementing, validating, submitting, recovering, and maintaining frontend forms and user-input workflows across the Eco Nojin ecosystem.

Forms are critical interaction surfaces. They collect information that may affect:

- User identity and account security.
- Scientific model inputs and simulation configurations.
- Water, soil, agricultural, and environmental observations.
- Spatial and temporal data.
- Marketplace products, inventory, and orders.
- Financial amounts, prices, quantities, and transactions.
- Tourism services, bookings, and reservations.
- Administrative configurations and governance decisions.

Incorrect form behavior can cause data corruption, scientific inaccuracies, financial discrepancies, security vulnerabilities, and loss of user trust.

This standard establishes consistent behavior while preserving the different validation and integrity requirements of scientific, commercial, financial, and administrative workflows.

This document does not authorize any financial operation, scientific model execution, production deployment, or irreversible data modification.

# 2. Scope

This standard applies to:

- Simple input forms.
- Multi-step forms and wizards.
- Dynamic and conditional forms.
- Search and filtering interfaces.
- Authentication and profile forms.
- File-upload forms.
- Scientific configuration forms.
- Simulation input interfaces.
- Marketplace product and order forms.
- Financial and accounting forms.
- Tourism booking and service forms.
- Administrative configuration forms.
- Forms operating under offline or weak-connectivity conditions.

It covers:

1. Form architecture.
2. Input component behavior.
3. Validation.
4. Submission lifecycle.
5. Error handling.
6. Duplicate-submission prevention.
7. File uploads.
8. Draft persistence and recovery.
9. Scientific and financial input integrity.
10. Accessibility and localization.
11. Security and privacy.
12. Testing and acceptance criteria.

# 3. Core Principles

All form implementations SHOULD follow these principles:

## 3.1 Data Integrity First

User input must not be silently modified in ways that change its meaning.

The frontend MUST distinguish between:

- Raw user input.
- Normalized input.
- Validated input.
- Submitted payload.
- Server-accepted data.
- Persisted authoritative data.

These states MUST NOT be treated as interchangeable.

## 3.2 Client Validation Is Not Authoritative

Client-side validation improves usability but does not establish data integrity or security.

The backend MUST independently validate all security-sensitive, financial, scientific, and business-critical data.

## 3.3 Explicit User Intent

The interface MUST clearly communicate when an action:

- Saves a draft.
- Validates input.
- Submits data.
- Creates a record.
- Updates an existing record.
- Starts a scientific computation.
- Creates a commercial order.
- Initiates a financial operation.

The user MUST NOT be led to believe that an operation succeeded before authoritative confirmation.

## 3.4 Reversible Interaction Where Possible

Forms SHOULD support correction before submission.

Irreversible operations MUST require an explicit confirmation step when appropriate.

## 3.5 Consistent but Domain-Aware Behavior

Shared form infrastructure SHOULD be reused where practical.

However, scientific, financial, authentication, and administrative forms MUST retain their domain-specific validation and security rules.

# 4. Form Architecture

## 4.1 Form Responsibility Boundaries

A form SHOULD separate the following responsibilities:

| Layer | Responsibility |
|---|---|
| Presentation | Layout, labels, fields, help text |
| Input Management | Raw input and interaction state |
| Normalization | Controlled formatting and canonical representation |
| Client Validation | Immediate usability validation |
| Submission Controller | Submission lifecycle and request coordination |
| API/Data Layer | Communication with backend |
| Server Validation | Authoritative validation |
| Persistence | Saving accepted data |
| Feedback | Success, warning, and error communication |

Components SHOULD NOT combine all responsibilities into one large component.

## 4.2 Reusable Form Components

A shared component library SHOULD provide reusable patterns for:

- Text input.
- Numeric input.
- Text area.
- Select.
- Multi-select.
- Checkbox.
- Radio group.
- Date input.
- Time input.
- Date-time input.
- Range input.
- Searchable selection.
- File upload.
- Password input.
- Currency input.
- Measurement input.
- Coordinate input.
- Address input.
- Dynamic field groups.
- Multi-step navigation.
- Form-level validation summary.

Reusable components MUST preserve semantic HTML and accessibility behavior.

## 4.3 Component Configuration

Reusable fields SHOULD support configurable properties such as:

- Label.
- Description.
- Placeholder.
- Required status.
- Read-only status.
- Disabled status.
- Initial value.
- Validation rules.
- Error message.
- Help text.
- Input direction.
- Unit.
- Locale.
- Minimum and maximum values.
- Character limits.
- Accessibility attributes.

Configuration MUST NOT be treated as a substitute for backend validation.

# 5. Input Types and Data Representation

## 5.1 Text Inputs

Text inputs SHOULD define:

- Expected character type.
- Maximum length.
- Minimum length where applicable.
- Normalization policy.
- Whitespace behavior.
- Unicode handling.
- Allowed character rules.

The interface MUST NOT silently remove meaningful characters.

Unicode normalization MAY be used when required by the domain, but the normalization policy must be explicit.

## 5.2 Numeric Inputs

Numeric input components MUST distinguish between:

- Integer.
- Decimal.
- Percentage.
- Currency.
- Measurement.
- Scientific notation.
- Identifier-like numeric strings.

Identifiers such as phone numbers, postal codes, and account numbers MUST NOT automatically be treated as mathematical numbers.

Numeric fields SHOULD define:

- Minimum.
- Maximum.
- Precision.
- Scale.
- Unit.
- Rounding policy.
- Locale-specific display rules.

The display representation MUST NOT compromise the canonical submitted value.

## 5.3 Decimal Integrity

Financial values MUST NOT depend on binary floating-point arithmetic for authoritative calculations.

The frontend SHOULD preserve decimal input as a string or use a suitable decimal representation.

For example:

- Display: `1,250.75`
- Canonical decimal representation: `1250.75`

The conversion MUST be deterministic.

Rounding rules MUST be explicit and consistent with backend business rules.

The frontend MUST NOT independently determine authoritative financial totals.

## 5.4 Date and Time Inputs

Date and time inputs MUST distinguish:

- Calendar date.
- Local time.
- Local date-time.
- UTC timestamp.
- Time-zone-aware timestamp.

A calendar date MUST NOT be unintentionally converted into a different date through time-zone conversion.

The form SHOULD make time-zone assumptions explicit whenever they affect the meaning of submitted data.

## 5.5 Measurement Inputs

Scientific measurement fields SHOULD include:

- Value.
- Unit.
- Precision.
- Valid range.
- Measurement context.
- Optional uncertainty.
- Measurement method where applicable.

The frontend MUST NOT silently convert units without preserving the original meaning and conversion metadata where required.

## 5.6 Spatial Inputs

Spatial forms MAY accept:

- Latitude and longitude.
- Geometry.
- Polygon boundaries.
- Administrative regions.
- Raster or vector references.
- Map-based selections.

Spatial input validation SHOULD include:

- Coordinate reference system.
- Coordinate range.
- Geometry validity.
- Geometry completeness.
- Spatial extent.
- Expected geometry type.

A coordinate pair without an identified coordinate reference system MUST NOT automatically be interpreted as a complete spatial specification.

# 6. Form Lifecycle and Interaction States

Each form MUST have an explicit lifecycle.

Recommended states:

| State | Meaning |
|---|---|
| idle | No active interaction |
| pristine | No user modification |
| dirty | User has modified at least one field |
| validating | Validation is running |
| invalid | One or more validation errors exist |
| valid | Current input passes applicable client validation |
| submitting | Submission request is in progress |
| submitted | Submission request was accepted by the server |
| saved | Draft or record was successfully persisted |
| failed | Submission or persistence failed |
| recovering | A previous draft is being restored |

Implementations MAY use different internal representations, provided behavior remains equivalent.

## 6.1 Field-Level States

Fields SHOULD distinguish:

- Untouched.
- Touched.
- Dirty.
- Valid.
- Invalid.
- Disabled.
- Read-only.
- Pending validation.

A field error SHOULD NOT necessarily appear before the user has interacted with the field, unless the error is required to prevent a serious or irreversible mistake.

## 6.2 Form-Level States

The form MUST communicate:

- Whether changes are unsaved.
- Whether validation is running.
- Whether submission is in progress.
- Whether submission failed.
- Whether the server accepted the submission.
- Whether the data was actually persisted.

The visual state MUST correspond to the actual application state.

# 7. Validation Architecture

## 7.1 Validation Layers

Validation SHOULD be organized into multiple layers.

| Layer | Purpose |
|---|---|
| Input-level | Basic format and immediate constraints |
| Field-level | Individual field rules |
| Cross-field | Relationships between fields |
| Form-level | Overall completeness and consistency |
| Domain-level | Scientific or business rules |
| Server-level | Authoritative validation |
| Persistence-level | Database and integrity constraints |

A successful client validation MUST NOT imply successful server validation.

## 7.2 Client-Side Validation

Client-side validation SHOULD be used for:

- Required fields.
- Input format.
- Length constraints.
- Basic numeric ranges.
- Date consistency.
- Conditional field requirements.
- Immediate user feedback.

Validation SHOULD avoid unnecessary repetition and excessive interruption.

## 7.3 Server-Side Validation

The backend MUST validate all submitted data independently.

Server validation MUST cover:

- Data types.
- Required fields.
- Authorization.
- Business rules.
- Domain constraints.
- Ownership.
- Resource relationships.
- Financial integrity.
- Scientific constraints.
- File security.
- Duplicate and concurrency conditions.

The frontend MUST treat server validation as authoritative.

## 7.4 Cross-Field Validation

Cross-field validation is required where fields are logically dependent.

Examples:

- Start date must precede end date.
- Minimum quantity must not exceed maximum quantity.
- A selected irrigation method may require additional parameters.
- A scientific model may require a compatible combination of input variables.
- A booking end time must follow its start time.
- A financial allocation total may need to match a defined budget.

When one field changes, dependent validation SHOULD be recalculated.

## 7.5 Conditional Validation

Conditional fields MUST have explicit dependency rules.

If a field becomes irrelevant because of a changed selection:

- Its visibility MUST be updated.
- Its validation requirements MUST be updated.
- Its previous value MUST be handled according to a documented policy.
- Hidden values MUST NOT be submitted accidentally when they are no longer applicable.

## 7.6 Validation Timing

Possible validation triggers include:

- On input.
- On blur.
- On field change.
- On step transition.
- On submission.
- On server response.

Recommended approach:

- Lightweight format checks: during input where appropriate.
- Detailed field validation: on blur or after interaction.
- Cross-field validation: after relevant changes.
- Complete form validation: before submission.
- Authoritative validation: on the server.

No universal trigger policy is mandatory for every form.

# 8. Validation Schemas and Rules

## 8.1 Schema-Based Validation

Complex forms SHOULD use declarative validation schemas where this improves maintainability.

Potential tools MAY be evaluated, including:

- Zod.
- Yup.
- Valibot.
- JSON Schema-based validators.

No library is approved by this document.

Tool selection MUST consider:

- Bundle size.
- Type safety.
- Maintainability.
- Localization support.
- Nested object support.
- Conditional validation.
- Asynchronous validation.
- Server compatibility.
- License.
- Long-term maintenance.

## 8.2 Shared Validation Contracts

Where practical, frontend and backend SHOULD use compatible validation contracts.

However, sharing a schema MUST NOT remove the need for backend validation.

Frontend validation and backend validation may have different execution responsibilities.

## 8.3 Validation Versioning

If validation rules change over time, the system SHOULD maintain sufficient version information to identify the rules applied to important submitted records.

This is especially relevant to:

- Scientific model configurations.
- Environmental monitoring records.
- Financial transactions.
- Regulatory or audit-sensitive submissions.

# 9. Error Handling and User Feedback

## 9.1 Field-Level Errors

Field errors SHOULD:

- Identify the affected field.
- Explain the problem.
- Describe how to correct it.
- Use understandable language.
- Be associated programmatically with the field.

Generic messages such as "Invalid input" SHOULD be avoided when a more useful explanation is available.

## 9.2 Form-Level Errors

Form-level errors SHOULD summarize problems that cannot be adequately communicated through individual fields.

A validation summary SHOULD:

- Appear in a predictable location.
- Identify the affected fields.
- Provide navigation to invalid fields where practical.
- Be accessible to assistive technologies.

## 9.3 Server Error Mapping

Backend errors SHOULD be mapped to appropriate frontend feedback.

The mapping layer MUST distinguish:

- Field validation errors.
- Authentication errors.
- Authorization errors.
- Business-rule violations.
- Resource conflicts.
- Rate limits.
- Network failures.
- Server failures.
- Unknown errors.

The frontend MUST NOT expose internal stack traces, SQL details, secret values, or sensitive implementation information.

## 9.4 Error Message Localization

Error messages MUST support the active application locale.

Messages SHOULD be generated from stable error codes or structured validation responses rather than relying exclusively on backend prose.

The same error SHOULD have consistent meaning across products.

## 9.5 Error Recovery

Where possible, the form SHOULD preserve valid user input after a recoverable error.

The interface MUST NOT clear the entire form after a network failure unless explicitly required by a security policy.

# 10. Submission Management

## 10.1 Submission Lifecycle

A typical submission SHOULD follow this sequence:

1. User initiates submission.
2. Client validates the current form.
3. Invalid fields are identified.
4. Valid data is normalized.
5. Submission payload is constructed.
6. Submission state changes to `submitting`.
7. Request is sent to the backend.
8. Backend validates the request.
9. Backend accepts or rejects the operation.
10. Frontend processes the authoritative response.
11. The user receives a clear result.
12. Form state is updated.

The exact sequence MAY vary according to the domain and API contract.

## 10.2 Duplicate Submission Prevention

The frontend MUST prevent accidental repeated submissions.

Recommended mechanisms:

- Disable the submit action while a request is active.
- Prevent concurrent submissions for the same form operation.
- Track request state.
- Avoid duplicate event handlers.
- Provide clear progress feedback.

These controls improve usability but do not guarantee backend idempotency.

## 10.3 Idempotency

Operations that may be retried after network uncertainty SHOULD use backend-supported idempotency mechanisms where appropriate.

The frontend MUST NOT assume that disabling a button guarantees exactly-once execution.

The backend SHOULD define:

- Idempotency key format.
- Scope.
- Retention period.
- Duplicate request behavior.
- Conflict response behavior.

For financial and order-creation workflows, idempotency requirements MUST be explicitly defined before implementation.

## 10.4 Uncertain Submission Results

A network timeout does not prove that the backend rejected an operation.

When the frontend cannot determine whether an operation succeeded:

- It MUST NOT automatically report failure as a confirmed fact.
- It SHOULD indicate that the result is uncertain.
- It SHOULD provide a safe status-recovery mechanism.
- It MUST avoid blindly creating a second operation.
- It SHOULD use an operation identifier or idempotency key when supported.

This is particularly important for orders, payments, bookings, and financial records.

## 10.5 Success Feedback

Success messages MUST correspond to an authoritative backend response.

The frontend MUST distinguish between:

- Request sent.
- Request received.
- Request accepted.
- Record created.
- Record persisted.
- Operation completed.

These statuses MUST NOT be collapsed into a generic success message.

# 11. Multi-Step Forms and Wizards

## 11.1 General Requirements

Multi-step forms SHOULD:

- Clearly identify the current step.
- Show overall progress.
- Allow navigation to previous steps.
- Preserve valid values when moving between steps.
- Validate relevant fields before advancing.
- Provide a final review step for high-impact operations.
- Communicate incomplete steps.

## 11.2 Step State

Each step SHOULD have an explicit status:

- Not started.
- In progress.
- Valid.
- Invalid.
- Completed.
- Locked.

A step MUST NOT be marked completed solely because the user visited it.

## 11.3 Conditional Steps

Conditional steps MUST be generated from explicit business or scientific rules.

When earlier answers change:

- Dependent steps MUST be recalculated.
- Obsolete data MUST be handled according to an explicit policy.
- The final payload MUST exclude invalid or irrelevant values.

## 11.4 Final Review

High-impact workflows SHOULD provide a review screen before submission.

Examples:

- Scientific simulation configuration.
- Product publication.
- Marketplace order confirmation.
- Financial allocation.
- Administrative configuration.
- Booking and reservation confirmation.

The review screen SHOULD display important values in a human-readable format.

# 12. File Upload Standards

## 12.1 Supported File Categories

File upload forms MAY support:

- Images.
- Documents.
- Spreadsheets.
- Scientific datasets.
- Geospatial files.
- Satellite-derived data.
- Environmental monitoring files.

Allowed file types MUST be explicitly configured for each workflow.

## 12.2 File Validation

The frontend SHOULD validate:

- File size.
- File extension.
- Declared MIME type.
- Number of files.
- Total upload size.
- Basic format compatibility.

Frontend validation is not a security boundary.

The backend MUST independently inspect uploaded files.

## 12.3 Security Requirements

The backend MUST enforce:

- File signature inspection.
- Malware scanning where appropriate.
- File-type restrictions.
- Safe storage.
- Access control.
- File-name sanitization.
- Upload-size limits.
- Archive extraction protections.
- Safe download behavior.

Executable or active content MUST NOT be trusted because its extension appears acceptable.

## 12.4 Upload Progress

For large uploads, the interface SHOULD provide:

- Upload progress.
- Cancel action where supported.
- Retry behavior.
- Failure reason.
- Completion confirmation.

Upload completion MUST NOT be confused with successful processing or validation of the uploaded dataset.

## 12.5 Preview

Previews SHOULD be generated safely.

The frontend MUST avoid executing untrusted uploaded content.

Scientific and geospatial previews SHOULD communicate:

- Detected format.
- Spatial reference where available.
- Time range where applicable.
- Data dimensions.
- Validation status.

# 13. Draft Persistence and Recovery

## 13.1 Draft Support

Long or complex forms SHOULD support draft persistence where appropriate.

Potential draft storage mechanisms include:

- Backend draft records.
- Session-based persistence.
- Browser storage.
- IndexedDB.
- Application-managed temporary storage.

The selection MUST be based on sensitivity, data volume, recovery requirements, and security considerations.

## 13.2 Sensitive Data

Passwords, authentication secrets, payment credentials, and other highly sensitive data MUST NOT be persisted in ordinary browser storage.

Financial or personal information MUST NOT be stored locally without an explicit security assessment and appropriate safeguards.

## 13.3 Recovery Behavior

When recovering a draft, the frontend SHOULD identify:

- Draft creation time.
- Last update time.
- Draft version.
- Applicable form version.
- Whether the draft is still compatible.
- Whether server-side changes may conflict with it.

## 13.4 Draft Expiration

Draft expiration SHOULD be explicit.

The system SHOULD define:

- Retention period.
- Expiration behavior.
- User notification.
- Recovery limitations.
- Deletion policy.

## 13.5 Conflict Handling

If a draft conflicts with newer server-side data:

- The frontend MUST NOT silently overwrite authoritative data.
- The conflict MUST be communicated.
- The system SHOULD provide a controlled resolution process.

# 14. Scientific Form Requirements — HyDroMA

Scientific forms require stricter semantic and numerical integrity than ordinary user-input forms.

## 14.1 Scientific Input Metadata

Where applicable, each scientific input SHOULD preserve:

- Variable identifier.
- Value.
- Unit.
- Measurement method.
- Data source.
- Spatial scope.
- Temporal scope.
- Coordinate reference system.
- Measurement timestamp.
- Quality indicator.
- Uncertainty.
- Model compatibility.
- Applicable schema or configuration version.

Not every field requires every metadata item. Requirements MUST be determined by the scientific variable and model.

## 14.2 Unit Safety

The frontend MUST make units visible and unambiguous.

The system SHOULD prevent incompatible unit combinations.

Conversions MUST be deterministic and traceable where scientific reproducibility requires it.

A numeric value without a defined unit MUST NOT be silently interpreted as a scientific measurement when a unit is required.

## 14.3 Scientific Range Validation

Scientific ranges MUST be derived from documented domain rules.

The frontend MUST distinguish between:

- Physically impossible values.
- Values outside expected operating ranges.
- Unusual but scientifically possible values.
- Missing or uncertain measurements.

An unusual value SHOULD NOT automatically be rejected unless a validated rule requires rejection.

## 14.4 Simulation Configuration Forms

Simulation forms SHOULD preserve:

- Model identifier.
- Model version.
- Input dataset references.
- Parameter values.
- Parameter units.
- Initial conditions.
- Boundary conditions.
- Spatial domain.
- Simulation period.
- Temporal resolution.
- Configuration version.

The frontend MUST NOT claim that a simulation has completed merely because its configuration was submitted.

## 14.5 Scientific Validation Feedback

Scientific validation messages SHOULD distinguish:

- Missing required input.
- Invalid unit.
- Incompatible parameter.
- Unsupported model configuration.
- Spatial inconsistency.
- Temporal inconsistency.
- Data quality warning.
- Model execution failure.

Warnings MUST NOT be displayed as confirmed scientific conclusions.

## 14.6 Reproducibility

Important scientific submissions SHOULD retain a reference to the exact input configuration and applicable model or schema version.

Changing a form definition MUST NOT silently change the interpretation of an already persisted scientific record.

# 15. Financial and Marketplace Form Requirements

Financial and commercial forms require strict consistency between user input, backend calculations, and persisted records.

## 15.1 Monetary Inputs

Monetary fields MUST define:

- Currency.
- Decimal precision.
- Accepted range.
- Rounding policy.
- Formatting rules.
- Whether negative values are allowed.

The frontend MUST NOT infer currency solely from the user's locale.

## 15.2 Price and Quantity

Product forms SHOULD validate:

- Price.
- Quantity.
- Unit.
- Availability.
- Minimum order quantity.
- Maximum order quantity.
- Applicable product constraints.

The backend MUST recalculate authoritative totals.

## 15.3 Order Forms

Order forms SHOULD display:

- Selected products.
- Quantities.
- Unit prices.
- Discounts where applicable.
- Delivery costs where applicable.
- Taxes where applicable.
- Total amount.
- Currency.

The displayed total SHOULD be identified as an estimate until confirmed by the backend when server-side calculations may change it.

## 15.4 Financial Integrity

The frontend MUST NOT:

- Treat a locally calculated total as an authoritative ledger entry.
- Confirm payment without backend confirmation.
- Create a successful transaction state based only on a client response assumption.
- Use floating-point arithmetic for authoritative monetary calculations.
- Modify transaction history locally as if it were persisted.
- Hide a failed or uncertain financial operation.

Financial records MUST be sourced from authoritative backend responses.

## 15.5 Confirmation

Before high-impact financial or commercial submission, the interface SHOULD show a clear summary.

The user MUST be able to distinguish:

- Draft.
- Pending.
- Submitted.
- Accepted.
- Rejected.
- Paid.
- Failed.
- Reconciliation required.

The exact status vocabulary MUST match the backend contract.

# 16. Authentication and Account Forms

Authentication-related forms SHOULD include:

- Login.
- Registration.
- Password reset.
- Password change.
- Multi-factor authentication.
- Account recovery.
- Profile updates.

Requirements:

- Password fields MUST use appropriate input semantics.
- Passwords MUST NOT be logged.
- Authentication tokens MUST NOT be included in validation messages.
- Sensitive authentication data MUST NOT be stored in ordinary form drafts.
- Authentication failures SHOULD avoid unnecessary account enumeration.
- Rate limiting MUST be enforced by the backend.
- The frontend SHOULD communicate security challenges clearly.

The frontend MUST NOT implement authentication security solely through form behavior.

# 17. Accessibility and Inclusive Interaction

All forms MUST be designed for keyboard and assistive-technology use.

## 17.1 Labels and Instructions

Every input MUST have an accessible name.

Placeholder text MUST NOT replace a visible or programmatic label.

Required and optional fields MUST be identified clearly.

## 17.2 Error Accessibility

Validation errors SHOULD:

- Be programmatically associated with the relevant input.
- Be announced appropriately.
- Use understandable text.
- Avoid relying on color alone.

## 17.3 Keyboard Interaction

All form controls MUST support appropriate keyboard interaction.

Focus order MUST follow the visual and logical structure.

Keyboard focus MUST remain visible.

## 17.4 Focus Management

After failed submission, the form SHOULD:

- Present a validation summary.
- Move focus appropriately when necessary.
- Allow users to reach the first invalid field.
- Avoid unexpected focus jumps.

## 17.5 Dynamic Updates

Changes to conditional fields, validation results, and submission status SHOULD be communicated to assistive technologies where appropriate.

## 17.6 Accessibility Target

WCAG 2.2 Level AA SHOULD be used as the proposed accessibility target.

Automated accessibility testing MUST be supplemented with manual keyboard and assistive-technology testing.

# 18. Internationalization and Localization

Forms MUST support the application's approved locale configuration.

Requirements include:

- Localized labels.
- Localized validation messages.
- RTL and LTR layouts.
- Locale-aware date display.
- Locale-aware number display.
- Explicit currency representation.
- Unicode-safe input.
- Appropriate font selection.
- Consistent decimal separators.
- Accessible field descriptions.

## 18.1 Canonical Values

Displayed values and submitted values MUST be distinguished.

Examples:

| Display | Canonical Representation |
|---|---|
| ۱٬۲۵۰٫۷۵ | 1250.75 |
| ۱۲۵۰٫۷۵ | 1250.75 |
| 2026-11-18 | ISO date representation |
| ۱۴۰۵/۰۸/۲۷ | Locale-specific calendar display |

The examples illustrate formatting only. Actual conversion rules MUST be defined by the application.

## 18.2 RTL Requirements

RTL layouts MUST preserve:

- Correct label alignment.
- Logical field order.
- Appropriate icon placement.
- Correct numeric and code rendering.
- Predictable keyboard navigation.

Mixed-direction content SHOULD use appropriate bidirectional isolation.

# 19. Responsive and Mobile Form Behavior

Forms MUST remain usable across supported screen sizes.

Requirements:

- Inputs MUST fit within the available viewport.
- Labels MUST remain readable.
- Validation messages MUST not be clipped.
- Touch targets SHOULD be sufficiently large.
- Multi-step navigation MUST work on mobile.
- Virtual keyboard behavior SHOULD be considered.
- Sticky controls MUST NOT obscure form content.
- Long forms SHOULD preserve navigation context.

The form MUST NOT require horizontal scrolling for ordinary data entry on supported mobile viewports unless the domain genuinely requires it.

# 20. Weak Connectivity and Offline Behavior

Eco Nojin may serve users with unstable or limited internet connectivity.

Forms SHOULD support appropriate resilience mechanisms.

Possible mechanisms:

- Local draft preservation.
- Explicit retry.
- Upload resumption where supported.
- Request-state recovery.
- Clear connectivity indicators.
- Delayed synchronization for safe data types.

## 20.1 Offline Submission Restrictions

Offline availability MUST NOT imply that a server operation has completed.

The frontend MUST distinguish:

- Saved locally.
- Queued for synchronization.
- Sent to the server.
- Accepted by the server.
- Persisted by the server.

Financial operations, order confirmation, and other high-impact actions MUST NOT be presented as completed while offline.

## 20.2 Synchronization

When queued data is synchronized:

- Backend validation MUST be repeated.
- Authorization MUST be checked again.
- Conflicts MUST be detected.
- Duplicate operations MUST be prevented through appropriate backend mechanisms.
- The final result MUST be communicated.

# 21. Security and Privacy

Forms are a significant attack surface.

## 21.1 Input Security

The frontend MUST NOT assume that user input is safe.

The backend MUST apply appropriate validation, encoding, and sanitization according to the context.

Frontend validation MUST NOT be treated as protection against:

- SQL injection.
- Cross-site scripting.
- Command injection.
- Path traversal.
- Malicious file uploads.
- Unauthorized data modification.

## 21.2 Sensitive Information

Sensitive fields MUST NOT be exposed through:

- Console logs.
- Analytics events.
- Error-reporting payloads.
- Browser-visible debug output.
- Unnecessary local persistence.
- Unprotected URLs.

## 21.3 Authorization

The frontend MAY hide or disable fields based on user permissions, but the backend MUST enforce authorization independently.

A user modifying client-side state MUST NOT gain access to protected operations.

## 21.4 CSRF and Request Security

Request protection MUST follow the application's backend authentication architecture.

The frontend MUST comply with the applicable CSRF, cookie, and token-handling requirements.

## 21.5 Auditability

High-impact forms SHOULD generate appropriate audit events through the backend.

Audit events SHOULD identify:

- Actor.
- Operation.
- Target record.
- Timestamp.
- Outcome.
- Relevant version or correlation identifier.

Sensitive field values MUST NOT be indiscriminately copied into audit logs.

# 22. Performance and Reliability

Forms SHOULD remain responsive during:

- Large validation operations.
- Dynamic field generation.
- Large data selection.
- File uploads.
- Scientific configuration.
- Multi-step navigation.

Requirements:

- Avoid unnecessary full-form re-rendering.
- Debounce expensive asynchronous checks where appropriate.
- Cancel obsolete validation requests where safe.
- Avoid duplicate API requests.
- Preserve user input during recoverable failures.
- Handle slow responses explicitly.

Performance optimization MUST NOT weaken validation or data integrity.

# 23. Testing and Quality Assurance

Form testing MUST cover more than successful submission.

## 23.1 Unit Tests

Test:

- Field behavior.
- Input normalization.
- Validation rules.
- Decimal handling.
- Date and time handling.
- Unit conversions.
- Conditional fields.
- Error mapping.
- State transitions.

## 23.2 Component Tests

Test:

- Labels.
- Required indicators.
- Disabled and read-only states.
- Error display.
- Keyboard interaction.
- Focus behavior.
- Responsive rendering.

## 23.3 Integration Tests

Test:

- API submission.
- Server validation errors.
- Authentication failures.
- Authorization failures.
- Network interruptions.
- Retry behavior.
- Draft recovery.
- Upload handling.

## 23.4 End-to-End Tests

Test complete workflows, including:

- Registration.
- Profile updates.
- Scientific configuration.
- Simulation submission.
- Product creation.
- Order creation.
- Booking.
- Financial forms.
- Administrative configuration.

## 23.5 Domain-Specific Tests

Scientific forms MUST test:

- Unit consistency.
- Spatial validity.
- Temporal validity.
- Parameter compatibility.
- Configuration versioning.

Financial forms MUST test:

- Decimal precision.
- Rounding.
- Currency handling.
- Quantity constraints.
- Duplicate submission.
- Uncertain network outcomes.
- Backend-authoritative totals.

## 23.6 Negative Testing

Tests MUST include:

- Empty input.
- Invalid formats.
- Boundary values.
- Unexpected values.
- Very long strings.
- Unicode edge cases.
- Repeated submissions.
- Expired sessions.
- Server rejection.
- Network timeout.
- Browser refresh during editing.
- Stale drafts.
- Malicious file attempts.

## 23.7 Accessibility Testing

Testing SHOULD include:

- Keyboard-only navigation.
- Screen-reader interaction.
- Error announcements.
- Focus management.
- RTL/LTR behavior.
- Zoom and responsive layouts.

# 24. Observability and Analytics

Form observability SHOULD focus on operational reliability and user experience.

Potential events include:

- `form_opened`
- `form_validation_failed`
- `form_submission_started`
- `form_submission_accepted`
- `form_submission_failed`
- `form_draft_saved`
- `form_draft_recovered`
- `form_upload_started`
- `form_upload_completed`

Events MUST be designed to avoid collecting sensitive field values.

## 24.1 Metrics

Potential metrics include:

- Submission success rate.
- Validation failure rate.
- Abandonment rate.
- Average completion time.
- API failure rate.
- Upload failure rate.
- Draft recovery rate.
- Duplicate submission attempts.

## 24.2 Privacy

Analytics MUST NOT capture:

- Passwords.
- Authentication tokens.
- Payment credentials.
- Sensitive personal information.
- Confidential scientific data.
- Full financial form contents.

Telemetry collection MUST follow the applicable privacy and consent policies.

# 25. Governance and Implementation Rules

## 25.1 Form Specification

Each important form SHOULD have a documented specification containing:

- Form identifier.
- Product and route.
- Purpose.
- User roles.
- Field definitions.
- Data types.
- Units and currencies.
- Validation rules.
- Conditional dependencies.
- API contract.
- Error behavior.
- Persistence behavior.
- Security classification.
- Accessibility requirements.
- Test coverage.

## 25.2 Ownership

Each form MUST have an identifiable product or technical owner.

Scientific forms SHOULD also have an appropriate domain owner.

Financial forms SHOULD have an appropriate business or financial control owner.

## 25.3 Change Management

Changes to high-impact form fields MUST be reviewed for:

- API compatibility.
- Data migration implications.
- Historical record interpretation.
- Validation consistency.
- Security.
- Accessibility.
- Localization.
- Test coverage.

A field rename or type change MUST NOT be assumed to be backward-compatible.

# 26. Proposed Implementation Roadmap

The following sequence is proposed and is not an implementation authorization.

| Phase | Scope | Expected Output |
|---|---|---|
| Phase 1 | Form inventory | Catalog of existing forms |
| Phase 2 | Form architecture | Agreed component and lifecycle design |
| Phase 3 | Validation contracts | Frontend/backend validation mapping |
| Phase 4 | Shared components | Reusable accessible field components |
| Phase 5 | Submission infrastructure | Submission and error-handling mechanisms |
| Phase 6 | Draft and recovery | Approved persistence and recovery behavior |
| Phase 7 | Domain integration | Scientific, financial, marketplace workflows |
| Phase 8 | Quality assurance | Unit, integration, E2E and accessibility evidence |
| Phase 9 | Controlled adoption | Gradual adoption after approval |

# 27. Risks and Failure Scenarios

| ID | Risk | Impact | Proposed Control |
|---|---|---|---|
| FR-001 | Client validation treated as authoritative | Data integrity failure | Mandatory backend validation |
| FR-002 | Floating-point monetary calculations | Financial discrepancies | Decimal-safe representation |
| FR-003 | Duplicate submissions | Duplicate records or operations | Backend idempotency and frontend controls |
| FR-004 | Uncertain request result | Duplicate or inconsistent operations | Operation-status recovery |
| FR-005 | Hidden conditional fields submitted | Incorrect records | Explicit dependency management |
| FR-006 | Unsafe draft persistence | Privacy breach | Data classification and storage policy |
| FR-007 | Unit ambiguity | Scientific error | Explicit unit metadata |
| FR-008 | Time-zone conversion errors | Incorrect temporal records | Explicit date/time semantics |
| FR-009 | Unsafe file upload | Security compromise | Backend inspection and controlled storage |
| FR-010 | Inaccessible validation feedback | User exclusion | WCAG-oriented implementation and testing |
| FR-011 | Stale draft overwrites current data | Data loss | Conflict detection |
| FR-012 | Premature success message | Misleading user | Backend-authoritative status |
| FR-013 | Locale-dependent parsing errors | Incorrect values | Canonical value representation |
| FR-014 | Inconsistent frontend/backend rules | Rejected or corrupted submissions | Contract-based validation |
| FR-015 | Sensitive analytics capture | Privacy breach | Telemetry minimization and masking |

# 28. Open Architecture Decisions

The following decisions remain OPEN and require owner or architecture approval.

| ID | Decision | Status |
|---|---|---|
| FR-D01 | Shared form library selection | OPEN |
| FR-D02 | Validation library selection | OPEN |
| FR-D03 | Frontend/backend schema-sharing strategy | OPEN |
| FR-D04 | Standard form lifecycle implementation | OPEN |
| FR-D05 | Draft persistence strategy | OPEN |
| FR-D06 | Sensitive form data classification | OPEN |
| FR-D07 | Idempotency contract for critical submissions | OPEN |
| FR-D08 | File upload architecture | OPEN |
| FR-D09 | Scientific unit-input architecture | OPEN |
| FR-D10 | Decimal input and formatting implementation | OPEN |
| FR-D11 | Date and calendar handling strategy | OPEN |
| FR-D12 | Multi-step form state architecture | OPEN |
| FR-D13 | Form error-code contract | OPEN |
| FR-D14 | Offline form synchronization policy | OPEN |
| FR-D15 | Form analytics and privacy policy | OPEN |
| FR-D16 | Form specification and ownership registry | OPEN |

No decision in this table is approved by this document.

# 29. Acceptance Criteria

An implementation claiming compliance with this standard SHOULD demonstrate the following:

## Architecture

- Form responsibilities are separated.
- Shared components have documented interfaces.
- Form lifecycle states are explicit.
- Domain-specific requirements are preserved.

## Validation

- Client validation is implemented where appropriate.
- Backend validation is authoritative.
- Cross-field and conditional rules are tested.
- Error messages are understandable and localized.

## Submission

- Duplicate submissions are controlled.
- Critical operations use appropriate backend idempotency.
- Uncertain request outcomes are handled safely.
- Success feedback reflects authoritative backend status.

## Data Integrity

- Monetary values preserve decimal integrity.
- Scientific values retain units and required metadata.
- Dates and times preserve their intended semantics.
- Invalid hidden fields are not submitted accidentally.

## Security

- Sensitive values are not logged.
- Draft persistence follows data classification.
- File uploads are independently validated by the backend.
- Authorization is enforced by the backend.

## Accessibility

- Fields have accessible labels.
- Errors are programmatically associated.
- Keyboard navigation works.
- Focus management is predictable.
- RTL/LTR behavior is tested.

## Reliability

- Recoverable errors preserve appropriate input.
- Weak connectivity does not create false success states.
- Draft recovery and conflict handling are tested where supported.

## Evidence

- Relevant unit tests pass.
- Integration tests pass.
- Critical workflows have E2E coverage.
- Accessibility checks are documented.
- Domain-specific validation evidence exists.

# 30. Definition of Done

A form or form workflow MUST NOT be considered complete merely because its interface renders or its submit button works.

Completion requires evidence for all applicable stages:

1. SPECIFIED
2. DESIGNED
3. IMPLEMENTED
4. UNIT_TESTED
5. INTEGRATION_TESTED
6. E2E_TESTED
7. SECURITY_REVIEWED
8. ACCESSIBILITY_REVIEWED
9. DOMAIN_VALIDATED
10. ACCEPTED
11. RELEASED

Not every form requires the same level of domain validation, but every applicable stage MUST be evidenced.

The following statements are explicitly NOT equivalent:

- Form exists ≠ Form is functional.
- Client validation passes ≠ Data is valid.
- Request sent ≠ Request accepted.
- Request accepted ≠ Record persisted.
- Upload completed ≠ Dataset validated.
- Simulation submitted ≠ Simulation completed.
- Financial form submitted ≠ Transaction completed.
- Tests passed ≠ Production readiness established.

# 31. Final Status

**Document Status:** DRAFT — PROPOSED — NOT APPROVED

**Implementation Status:** NOT VERIFIED

**Architecture Decisions:** OPEN

**Production Authorization:** NOT GRANTED

This document establishes proposed frontend form and input-management standards for the Eco Nojin ecosystem. It does not authorize implementation choices, production activation, financial operations, or changes to existing repositories.

All implementation work MUST preserve existing project data and MUST NOT modify `D:\HyDroMA` or `D:\eco_nojin` unless separately authorized.