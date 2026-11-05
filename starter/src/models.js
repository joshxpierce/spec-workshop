export const Verdict = Object.freeze({
  ALLOW: 'ALLOW',
  QUARANTINE: 'QUARANTINE',
  BLOCK: 'BLOCK',
});

// Reason codes are part of a public contract: the reporting job and
// downstream dashboards key on these exact strings.
export const Reason = Object.freeze({
  BLOCKLIST: 'BLOCKLIST',
  SPF_FAIL: 'SPF_FAIL',
  ATTACHMENT_TYPE: 'ATTACHMENT_TYPE',
  CLEAN: 'CLEAN',
});

export const RISKY_ATTACHMENT_EXTENSIONS = Object.freeze([
  '.exe',
  '.scr',
  '.js',
  '.vbs',
  '.iso',
  '.zip',
  '.html',
  '.docm',
  '.xlsm',
]);

export const SPF_RESULTS = Object.freeze(['pass', 'fail', 'softfail', 'none']);
