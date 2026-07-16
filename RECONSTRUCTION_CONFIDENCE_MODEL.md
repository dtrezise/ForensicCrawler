# Reconstruction and Confidence Model

Status: WORKING

## Three independent dimensions

### 1. Evidence state

What kind of support exists: directly observed, authenticated official record, independently corroborated, attributed but unverified, disputed, contradicted, inferred, interpolated, unresolved, superseded, or retracted.

### 2. Procedural status

What an authoritative process currently says: filed, alleged, charged, found, dismissed, corrected, withdrawn, under review, or another exact domain-specific state. This field is optional and never inferred from evidence confidence.

### 3. Confidence assessment

How strongly a defined method supports a bounded proposition. It includes method, inputs, rationale, contrary evidence, uncertainty sources, lower/upper bounds when defensible, assessor, review date, and model/software version.

## Reconstruction element classes

- **Observed element:** directly visible or measured in a linked asset/record.
- **Corroborated inference:** supported by multiple materially independent inputs and an explicit derivation.
- **Disputed element:** material evidence conflicts or a qualified challenge remains.
- **Interpolated element:** inserted across a documented evidence gap; never rendered as recorded reality.
- **Illustrative element:** orientation-only geometry or styling with no evidentiary meaning.

## Visual encoding

Every state uses:

- a text label;
- an icon;
- a pattern, border, or line-style distinction;
- accessible color as a redundant cue;
- provenance link count; and
- an explanation of method and uncertainty.

No red/yellow/green-only display. Motion and animation respect reduced-motion settings. Screen-reader text states what visual texture or line style conveys.

## Required toggles

- directly observed evidence only;
- corroborated inference;
- disputed evidence;
- interpolated elements;
- uncertainty overlay;
- alternate hypotheses;
- source and camera visibility; and
- transformation history.

## Derivation record

Every reconstructive calculation records:

- permanent element and revision IDs;
- input observations/assets and exact locators;
- coordinate/time reference systems;
- method, parameters, software/model and version;
- calibration and validation inputs;
- output hash and deterministic seed when applicable;
- precision, uncertainty, error bounds, and known failure modes;
- alternatives considered and contrary evidence;
- responsible process/operator and reviewer; and
- supersession or withdrawal history.

## Apollo 11 pilot example

The interface does not choose a single exact touchdown second. It presents two authenticated official-record anchors (`102:45:39.9` and `102:45:43`) plus a 3.1-second discrepancy. The occurrence of landing is strongly supported; the exact cross-record time is unresolved until clock and reporting methodology are reconciled. High confidence in occurrence does not erase the timing conflict.
