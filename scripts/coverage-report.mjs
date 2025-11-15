#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const repoRoot = path.resolve(__dirname, '..');

const REPORT_PATH = path.join(repoRoot, 'reports/coverage-baseline-2025-10-19.md');
const THRESHOLD_PATH = path.join(repoRoot, 'reports/coverage-threshold.json');
const METRICS = ['statements', 'branches', 'functions', 'lines'];
const WORKSPACES = [
    {
        key: 'nuxt',
        label: 'Nuxt (`apps/nuxt`)',
        summaryPath: path.join(repoRoot, 'apps/nuxt/coverage/coverage-summary.json'),
    },
    {
        key: 'worker',
        label: 'Worker (`apps/worker`)',
        summaryPath: path.join(repoRoot, 'apps/worker/coverage/coverage-summary.json'),
    },
    {
        key: 'shared',
        label: 'Shared (`packages/shared`)',
        summaryPath: path.join(repoRoot, 'packages/shared/coverage/coverage-summary.json'),
    },
];
const WRITE_FLAG = '--write';
const TOLERANCE = 0.05; // allow tiny rounding drift without tripping the gate

const args = process.argv.slice(2);
const shouldWrite = args.includes(WRITE_FLAG);

const rel = (absolutePath) => path.relative(repoRoot, absolutePath);

const readJson = async (absolutePath, missingMessage) => {
    try {
        const raw = await readFile(absolutePath, 'utf8');
        return JSON.parse(raw);
    } catch (error) {
        if (error.code === 'ENOENT' && missingMessage) {
            throw new Error(missingMessage);
        }

        throw new Error(`Failed to read ${rel(absolutePath)}: ${error.message}`);
    }
};

const round = (value) => Math.round(value * 100) / 100;
const format = (value) => value.toFixed(2);

const thresholdData = await readJson(
    THRESHOLD_PATH,
    `Missing threshold file at ${rel(THRESHOLD_PATH)}. Create it with the minimum allowed percentages before checking coverage.`,
);

const coverageRows = [];
const failures = [];

for (const workspace of WORKSPACES) {
    const summary = await readJson(
        workspace.summaryPath,
        `Missing coverage summary at ${rel(workspace.summaryPath)}. Run 'pnpm test:coverage' first.`,
    );

    if (!summary?.total) {
        throw new Error(`Coverage summary at ${rel(workspace.summaryPath)} does not expose a total stanza.`);
    }

    const totals = summary.total;
    const row = { workspace: workspace.label };
    const workspaceThreshold = thresholdData[workspace.key];

    if (!workspaceThreshold) {
        throw new Error(
            `Thresholds for '${workspace.key}' are missing from ${rel(THRESHOLD_PATH)}. Add them before continuing.`,
        );
    }

    for (const metric of METRICS) {
        const rawValue = Number(totals?.[metric]?.pct);

        if (!Number.isFinite(rawValue)) {
            throw new Error(
                `Metric '${metric}' is unavailable in ${rel(workspace.summaryPath)}. Re-run tests or inspect the coverage config.`,
            );
        }

        const roundedValue = round(rawValue);
        row[metric] = roundedValue;

        const thresholdValue = workspaceThreshold[metric];

        if (typeof thresholdValue !== 'number') {
            throw new Error(
                `Threshold for '${workspace.key}' metric '${metric}' is missing in ${rel(THRESHOLD_PATH)}.`,
            );
        }

        if (roundedValue + TOLERANCE < thresholdValue) {
            failures.push(
                `${workspace.label} – ${metric} ${format(roundedValue)}% < threshold ${format(thresholdValue)}%`,
            );
        }
    }

    coverageRows.push(row);
}

if (failures.length > 0) {
    console.error('❌ Coverage fell below the enforced thresholds:');
    for (const failure of failures) {
        console.error(`   • ${failure}`);
    }
    console.error(`\nEither restore the missing coverage or update ${rel(THRESHOLD_PATH)} after verifying improvements.`);
    process.exit(1);
}

const today = new Date().toISOString().split('T')[0];
const header = `# Coverage Report – ${today}

Generated with \`pnpm test:coverage\`.

Minimum guardrails live in \`${rel(THRESHOLD_PATH)}\`.
`;

const tableHeader = '| Workspace | Statements | Branches | Functions | Lines |\n|-----------|------------|----------|-----------|-------|';
const tableRows = coverageRows.map(
    (row) =>
        `| ${row.workspace} | ${format(row.statements)}% | ${format(row.branches)}% | ${format(row.functions)}% | ${format(row.lines)}% |`,
);
const reportContent = `${header}\n${tableHeader}\n${tableRows.join('\n')}\n`;

if (shouldWrite) {
    await writeFile(REPORT_PATH, `${reportContent}`);
    console.log(`✅ Wrote coverage report to ${rel(REPORT_PATH)}`);
    process.exit(0);
}

let existingReport = '';
try {
    existingReport = await readFile(REPORT_PATH, 'utf8');
} catch (error) {
    if (error.code === 'ENOENT') {
        console.error(`Coverage report ${rel(REPORT_PATH)} is missing. Re-run with '${WRITE_FLAG}' to generate it.`);
        process.exit(1);
    }

    throw error;
}

if (existingReport.trim() !== reportContent.trim()) {
    console.error(
        `Coverage report is out of date. Run 'pnpm coverage:report -- ${WRITE_FLAG}' locally after tests and commit ${rel(
            REPORT_PATH,
        )}.`,
    );
    process.exit(1);
}

console.log('✅ Coverage report is current and above the enforced thresholds.');
