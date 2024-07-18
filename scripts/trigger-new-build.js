function getCurrentBranch() {
  return process.env['VERCEL_GIT_COMMIT_REF'];
}

function getCurrentCommitMessage() {
  return process.env['VERCEL_GIT_COMMIT_MESSAGE'];
}

function isMainBranch() {
  return getCurrentBranch() === 'main';
}

function isDevelopBranch() {
  return getCurrentBranch() === 'develop';
}

function isReleaseCommit() {
  const message = getCurrentCommitMessage();
  return message && /^chore\(release\):/.test(message);
}

if ((isMainBranch() || isDevelopBranch()) && !isReleaseCommit()) {
  process.exit(0);
} else {
  process.exit(1);
}
