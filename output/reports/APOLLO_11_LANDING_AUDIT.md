# Apollo 11 Landing-Time Audit

Status: WORKING private review export
Package: `fc_pkg_00000000-0000-4000-8000-000000000001`
Schema: `1.0.0`
Exported: `2026-07-16T20:30:00Z`

## Scope

Demonstrate provenance, exact locators, temporal uncertainty, rights review, contradiction handling, and deterministic export using metadata-only official records.

No NASA source body or media is included. This report does not select a physically exact touchdown second.

## Claims

| Claim ID | State | Current text | Evidence relationships |
|---|---|---|---:|
| `fc_clm_00000000-0000-4000-8000-000000000001` | authenticated official record | Two official NASA records report that Eagle landed on the lunar surface; their exact recorded mission elapsed times differ by 3.1 seconds. | 2 |
| `fc_clm_00000000-0000-4000-8000-000000000002` | authenticated official record | The Apollo 11 Mission Report records landing on the surface at mission elapsed time 102:45:39.9. | 1 |
| `fc_clm_00000000-0000-4000-8000-000000000003` | authenticated official record | NASA's Record of Lunar Events lists lunar landing at mission elapsed time 102:45:43 and 20:17:43 GMT on July 20, 1969. | 1 |
| `fc_clm_00000000-0000-4000-8000-000000000004` | authenticated official record | NASA's Record of Lunar Events lists Armstrong on the lunar surface at mission elapsed time 109:24:15 and 02:56:15 GMT on July 21, 1969. | 1 |

## Temporal discrepancy

### Touchdown mission-time discrepancy

The mission report lists 102:45:39.9 while the event record lists 102:45:43. The records differ by 3.1 seconds but agree that the landing occurred.

Status: **open**. Review: **working**.

Alternate explanations:

- Different definitions of first surface contact versus recorded landing event
- Clock-source or synchronization differences
- Later administrative rounding or transcription
- A reporting convention not yet documented in the reviewed locators

## Sources and locators

| Source | Publisher | Locator | Storage |
|---|---|---|---|
| [Apollo 11 Mission Report](https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf) | National Aeronautics and Space Administration | section: 5.4 Landing Dynamics; page: Report page 5-14 | link_only |
| [Apollo 11 Record of Lunar Events](https://www.nasa.gov/wp-content/uploads/static/history/ap11ann/ap11events.html) | National Aeronautics and Space Administration | row: Lunar Landing Time; row: Armstrong on Lunar Surface | metadata_only |
| [NASA Images and Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) | National Aeronautics and Space Administration | section: NASA Images and Media Usage Guidelines | metadata_only |

## Provenance checks

- 2 local captures matched recorded SHA-256 and byte size.
- 1 transformation records link input and output captures.
- 5 append-only audit events passed hash-chain verification.
- 5 claim-source relationships include an exact function and locator.

## Rights and limitations

- **Apollo 11 Mission Report:** link_only; restrained_excerpt. Official NASA report used as metadata and locator. No PDF bytes are committed. NASA media guidance and item-specific third-party exceptions remain applicable.
- **Apollo 11 Record of Lunar Events:** metadata_only; restrained_excerpt. Official NASA event metadata and restrained factual transcription only; no remote page body retained.
- **NASA Images and Media Usage Guidelines:** metadata_only; metadata_only. Policy locator retained to document that NASA logos, identifiers, third-party works, and identifiable-person uses require separate treatment.
- **fc_ast_00000000-0000-4000-8000-000000000001:** permitted_bytes; project_bytes. Locally authored metadata comparison with source attribution; no copied NASA source body or media.

## Open questions

- Which timing and clock-reference conventions explain the 3.1-second difference between the two official records?

This is a WORKING prototype report, not a certified forensic or court-admissible package.
