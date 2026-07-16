# System Summary

Status: WORKING v0.1

## Definition

Forensic Crawler is a private research and reconstruction platform for lawfully discovering, preserving, organizing, comparing, and explaining multimedia evidence about a bounded event. The system keeps source content, observations, claims, analysis, annotations, and reconstruction elements distinct while retaining a reproducible provenance path among them.

## Defining promise

Every conclusion can be traced to evidence, every transformation is recorded, and every reconstruction visibly distinguishes observation from inference and interpolation.

## Users

The long-range audience includes authorized journalists, researchers, legal teams, documentary producers, insurers, investigators, archivists, and technical experts. Phase 1 is a private single-workspace analyst prototype, not a public evidence portal or high-impact decision system.

## System layers

1. **Governed discovery:** an approved source registry and bounded research manifest constrain what may be considered.
2. **Acquisition and custody:** allowed bytes are hashed, source-linked, rights-labeled, and recorded through append-only events.
3. **Normalized evidence:** permanent records represent investigations, events, claims, sources, assets, time, space, contradictions, corrections, and reviews.
4. **Analysis:** the workspace displays support, contradiction, context, authentication, and derivation without assigning automatic truth.
5. **Reconstruction:** later 2D and 3D elements point to the observations and transformations that produced them and expose uncertainty.
6. **Delivery:** deterministic private packages and human-readable reports enforce rights, privacy, status, and correction gates.

## Current vertical slice

The local MVP demonstrates a metadata-only Apollo 11 landing-time review. It compares a mission elapsed time of `102:45:39.9` in the Apollo 11 Mission Report with `102:45:43` in NASA's Record of Lunar Events. The records agree that landing occurred but differ by 3.1 seconds, so the system presents a temporal discrepancy and possible clock or reporting explanations instead of choosing a hidden “correct” value.

## Current boundaries

- no live crawler or browser automation;
- no copied NASA PDF, imagery, audio, or video;
- no social-media or authenticated source;
- no public viewer, publication, outreach, or expert contact;
- no 3D/VR/AR or mobile capture;
- no biometric, identity, guilt, motive, or sensitive-trait inference; and
- no court-admissibility, certification, or production-readiness claim.

## Authoritative versus rebuildable state

Authoritative records are versioned packages, permanent IDs, rights decisions, source locators, append-only revisions, correction events, and audit manifests. Search indexes, embeddings, thumbnails, media proxies, caches, and rendered reconstructions are rebuildable derivatives and never replace their inputs.
