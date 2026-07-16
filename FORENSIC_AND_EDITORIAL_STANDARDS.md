# Forensic and Editorial Standards

Status: WORKING

## Evidence doctrine

A source registry is a discovery and authorization aid, not a truth oracle. Assess every item individually. A primary record may be incomplete or wrong; a derivative source may accurately preserve unique evidence. Reputation can affect review priority but never supplies proof.

## Required claim record

Every material claim must include:

- permanent claim and revision IDs;
- exact claim text and normalized proposition;
- claimant or originating process;
- claim type and evidence state;
- procedural status when relevant;
- supporting, contradicting, contextual, response, authentication, and status relationships;
- retrieval and last-check dates;
- precise page, paragraph, exhibit, frame, timestamp, coordinate, or dataset-row locator;
- material contrary evidence and alternate explanations;
- uncertainty, confidence rationale, and bounds when defensible;
- unresolved questions; and
- correction, supersession, or retraction history.

## Record vocabularies

### Evidence state

- directly observed primary evidence;
- authenticated official record;
- independently corroborated;
- attributed but unverified;
- disputed;
- contradicted;
- inferred;
- interpolated;
- unresolved;
- superseded; and
- retracted.

### Relationship function

- supports;
- contradicts;
- contextualizes;
- authenticates;
- derives_from;
- depicts;
- contains_response;
- establishes_time;
- establishes_location;
- transforms; and
- supersedes.

Relationship function describes what a record contributes. It does not automatically determine the target claim's status.

## Required distinctions

- **Source claim:** what a source says.
- **Observation:** a bounded description of perceivable or measured material.
- **Attribution:** who is reported to have made or created something.
- **Analysis:** a reasoned interpretation of linked inputs.
- **Inference:** a conclusion not directly observed.
- **Interpolation:** an element inserted across a documented gap.
- **Expert opinion:** a consented, attributed professional assessment with limits.
- **Procedural status:** an official process state, not a truth judgment.
- **Correction/retraction:** a revision event that does not erase prior history.

## Prohibited editorial shortcuts

Never:

- convert allegation into fact;
- use source count as corroboration without independence analysis;
- infer authorship, identity, intent, affiliation, criminality, or sensitive traits from association;
- use absence of evidence as evidence of absence;
- treat AI output, a reconstruction, a search result, or an embedding match as independent corroboration;
- fill a metadata or evidence gap without marking it unresolved or interpolated;
- hide contrary evidence, denials, corrections, or timing uncertainty;
- describe “confidence” as legal or evidentiary status; or
- claim court admissibility without validated process and qualified review.

## Authentication checklist

Authentication is record-specific and may consider:

- original publication or custodian route;
- source and derivative history;
- content and file hashes;
- metadata consistency and known tool effects;
- visible edits, encoding, transcoding, cropping, or recompression;
- timestamp and clock source;
- location and environmental consistency;
- corroborating independent observations;
- contradictions and alternate explanations;
- acquisition method and custody gaps; and
- reviewer qualifications and limitations.

“Authenticated” always states who authenticated what, using which method, at what date, and within what limits.

## Temporal and geospatial rules

- Preserve the original time expression and reference clock.
- Normalize into UTC or an interval without discarding time zone, precision, leap-second, daylight-saving, clock-drift, or conversion assumptions.
- Display competing time anchors rather than collapsing them.
- Treat geolocation as an observation or inference with coordinate reference system, method, precision, and error bounds.
- Record camera position, field of view, line of sight, and occlusion as evidence-linked reconstruction parameters, not visual decoration.

## Corrections and red-team review

Before export or publication review:

1. search for sources that could falsify the working interpretation;
2. test duplicate/repost independence;
3. inspect broken or changed links and source versions;
4. confirm claim state and procedural status remain current;
5. reproduce transformations from recorded inputs and parameters;
6. review restricted and personal data;
7. state unresolved questions and alternate hypotheses; and
8. append review findings to `EDITORIAL_REVIEW_LOG.md` and the package audit log.
