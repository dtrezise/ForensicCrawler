export const ROOT: string;
export const PACKAGE_SCHEMA_PATH: string;

export function readJson(path: string): unknown;
export function canonicalize<T>(value: T): T;
export function canonicalStringify(value: unknown): string;
export function sha256(value: string | Uint8Array): string;
export function writeJson(path: string, value: unknown): void;
export function validatePackage(data: unknown): { valid: boolean; errors: string[] };
export function validateJsonSchema(data: unknown, schemaPath: string): { valid: boolean; errors: string[] };
export function eventHash(event: Record<string, unknown>): string;
export function sealAuditEvents(events: Array<Record<string, unknown>>): Array<Record<string, unknown>>;
export function recordIndex(data: Record<string, unknown>): {
  index: Map<string, { collection: string; record: Record<string, unknown> }>;
  duplicates: string[];
};
export function auditPackage(data: Record<string, unknown>): {
  valid: boolean;
  issues: string[];
  counts: Record<string, number>;
};
