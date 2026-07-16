# Source Registry Policy

Status: WORKING

## Purpose

The source registry defines which origins and source classes may be considered for a specific purpose and under which constraints. It is not a whitelist of truth and it does not replace record-level authentication, rights review, or human judgment.

## Required source entry

- permanent source-registry ID;
- display name and source type;
- canonical origin and exact allowed path patterns;
- disallowed paths and source features;
- public unauthenticated access confirmation;
- authorization and purpose basis;
- terms review URL, reviewer, date, summary, and expiry;
- robots user agent, snapshot hash, rule decision, fetch date, and expiry;
- per-origin concurrency, minimum delay, request/byte/depth/time budgets, and retry policy;
- allowed protocols, ports, MIME types, redirects, and response sizes;
- rights posture and allowed storage/display/export actions;
- privacy and sensitive-data restrictions;
- project-owned contact route and user-agent text when approved;
- retention and deletion policy;
- named owner and approver; and
- status: proposed, approved, paused, expired, denied, or revoked.

## Decision rules

1. Deny by default. Missing or expired review means no fetch.
2. A registry entry is purpose-specific; approval for one investigation does not authorize another.
3. Origin or path discovery does not expand scope.
4. Every URL, redirect, and resolved address re-enters the policy engine.
5. Terms, rights, privacy, or human review can be stricter than robots permission.
6. Authentication, paywall, CAPTCHA, block, or technical-safeguard bypass is never an approved registry capability.
7. Rate overrides may only become more conservative without renewed review.
8. Source reputation influences review priority, not evidence state.
9. Revocation stops queued and active work through the emergency-stop path and creates an audit event.

## Source classes for eventual review

- official government publications and datasets;
- court or administrative records with verified access status;
- openly licensed scientific or archival repositories;
- publisher pages available to ordinary unauthenticated visitors;
- licensed media or data services under project-owned agreements; and
- manually submitted files with documented authority and custody.

Social media, user accounts, private groups, leaked data, people-search services, and sources requiring evasion are out of scope.

## Current pilot entries

The Apollo 11 pilot registry is metadata-only. It records two official NASA locators and the NASA media guidance. It authorizes no crawler job and retains no remote body. Link existence was confirmed during manual research; automated monitoring remains disabled.
