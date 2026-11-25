# Verification

See [REVIEW.md](REVIEW.md) for the current release review and executed check results.

Local verification evidence is generated in `qa/` and is deliberately excluded from Git because it may include absolute machine paths, logs and temporary captures. Public screenshots are under the repository's `docs/screenshots/` directory.

Reproduce domain tests with `npm test`, browser tests with `npm run test:browser` while port4317 is serving, and JVM time tests with `scripts/test-native.ps1`. The extra media/offline script requires production preview port4318 as well.
