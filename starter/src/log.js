// Structured JSON logging, one object per line on stdout.
// Tests replace logger.write to capture lines.
export const logger = {
  write: (line) => process.stdout.write(line + '\n'),
};

export function log(event, fields = {}) {
  logger.write(JSON.stringify({ ts: new Date().toISOString(), event, ...fields }));
}
