# Notifications Architecture

**Status:** SCAFFOLDED (audit-derived in-app notifications exist in `services/api`).

## Responsibility
Notification events, templates, providers, channels, user preferences, delivery status, retry, failure handling.

## Boundaries
- Produces notifications from domain events; does not own domain data.
- No external delivery provider activated.

## Dependencies
Audit/events, IAM (preferences), integration adapters (future).

## Maturity / Future
SCAFFOLDED → IMPLEMENTED (in-app) → provider adapters (email/SMS) only with owner approval.