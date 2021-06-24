const core = require('@actions/core');
const github = require('@actions/github');
const issues = require('./issues');
const octokit = require('./octokit');

async function run() {
    try {
        const sourceIssueBody = github.context.payload.issue.body;
        const sourceIssueComment = core.getInput('source-issue-comment');
        const sourceIssueLabels = github.context.payload.issue.labels;
        const sourceIssueLock = core.getBooleanInput('source-issue-lock');
        const sourceIssueNumber = parseInt(core.getInput('source-issue-number', { required: true }));
        const sourceIssueOnlyLabelNames = core.getMultilineInput('source-issue-only-label-names');
        const sourceIssueOnlyLabelPrefixes = core.getMultilineInput('source-issue-only-label-prefixes');
        const sourceIssueSkipLabelNames = core.getMultilineInput('source-issue-skip-label-names');
        const sourceIssueSkipLabelPrefixes = core.getMultilineInput('source-issue-skip-label-prefixes');
        const sourceIssueTitle = github.context.payload.issue.title;
        const sourceRepositoryGithubToken = core.getInput('source-repository-github-token', { required: true });
        const sourceRepositoryName = github.context.repo.repo;
        const sourceRepositoryOwner = github.context.repo.owner;
        const targetIssueHeader = core.getInput('target-issue-header');
        const targetRepositoryGithubToken = core.getInput('target-repository-github-token', { required: true });
        let targetRepositoryName = core.getInput('target-repository-name');
        const targetRepositoryNamePrefix = core.getInput('target-repository-name-prefix');
        const targetRepositoryNamePrefixLabelName = core.getInput('target-repository-name-prefix-label-name');
        const targetRepositoryNamePrefixLabelPrefix = core.getInput('target-repository-name-prefix-label-prefix');
        const targetRepositoryOwner = core.getInput('target-repository-owner', { required: true });

        if ((targetRepositoryName === undefined || targetRepositoryName.length === 0) && (targetRepositoryNamePrefix === undefined || targetRepositoryNamePrefix.length === 0)) {
            throw new Error('must configure target-repository-name or target-repository-name-prefix');
        }

        if (targetRepositoryNamePrefix !== undefined && targetRepositoryNamePrefix.length > 0) {
            if (targetRepositoryNamePrefixLabelPrefix === undefined || targetRepositoryNamePrefixLabelPrefix.length === 0) {
                throw new Error('must configure target-repository-name-prefix-label-prefix with target-repository-name-prefix');
            }

            const targetRepositoryNameSuffix = targetRepositoryNamePrefixLabelName.replace(targetRepositoryNamePrefixLabelPrefix, '');
            targetRepositoryName = `${targetRepositoryNamePrefix}${targetRepositoryNameSuffix}`;
        }

        const sourceClient = await octokit(sourceRepositoryGithubToken);
        const targetClient = await octokit(targetRepositoryGithubToken);

        const outputs = {
            'target-issue-number': '',
            'target-issue-url': '',
            'target-repository-name': targetRepositoryName,
            'target-repository-owner': targetRepositoryOwner,
        };

        for (const property in outputs) {
            core.setOutput(property, outputs[property]);
        }

        const sourceIssue = `${sourceRepositoryOwner}/${sourceRepositoryName}#${sourceIssueNumber}`

        if (sourceIssueOnlyLabelNames !== undefined && sourceIssueOnlyLabelNames.length > 0) {
            for (const onlyLabelName of sourceIssueOnlyLabelNames) {
                const found = sourceIssueLabels.find((label) => label.name === onlyLabelName)

                if (found === undefined) {
                    core.info(`Skipping due to source issue (${sourceIssue}) missing required label name: ${onlyLabelName}`);

                    return outputs;
                }
            }
        }

        if (sourceIssueOnlyLabelPrefixes !== undefined && sourceIssueOnlyLabelPrefixes.length > 0) {
            for (const onlyLabelPrefix of sourceIssueOnlyLabelPrefixes) {
                const found = sourceIssueLabels.find((label) => label.name.startsWith(onlyLabelPrefix))

                if (found === undefined) {
                    core.info(`Skipping due to source issue (${sourceIssue}) missing required label prefix: ${onlyLabelPrefix}`);

                    return outputs;
                }
            }
        }

        if (sourceIssueSkipLabelNames !== undefined && sourceIssueSkipLabelNames.length > 0) {
            for (const skipLabelName of sourceIssueSkipLabelNames) {
                const found = sourceIssueLabels.find((label) => label.name === skipLabelName)

                if (found !== undefined) {
                    core.info(`Skipping due to source issue (${sourceIssue}) having skip label name: ${skipLabelName}`);

                    return outputs;
                }
            }
        }

        if (sourceIssueSkipLabelPrefixes !== undefined && sourceIssueSkipLabelPrefixes.length > 0) {
            for (const skipLabelPrefix of sourceIssueSkipLabelPrefixes) {
                const found = sourceIssueLabels.find((label) => label.name.startsWith(skipLabelPrefix))

                if (found !== undefined) {
                    core.info(`Skipping due to source issue (${sourceIssue}) having skip label prefix: ${skipLabelPrefix}`);

                    return outputs;
                }
            }
        }

        let targetIssueBody = sourceIssueBody;

        if (targetIssueHeader !== undefined && targetIssueHeader.length > 0) {
            targetIssueBody = `${targetIssueHeader}\n${targetIssueBody}`;
        }

        const openedIssue = await issues.open(targetClient, targetRepositoryOwner, targetRepositoryName, sourceIssueTitle, targetIssueBody);

        outputs['target-issue-number'] = openedIssue.number;
        outputs['target-issue-url'] = openedIssue.html_url;

        await issues.close(sourceClient, sourceRepositoryOwner, sourceRepositoryName, sourceIssueNumber);

        if (sourceIssueComment !== undefined && sourceIssueComment.length > 0) {
            await issues.comment(sourceClient, sourceRepositoryOwner, sourceRepositoryName, sourceIssueNumber, sourceIssueComment.replace('{target-issue-url}', openedIssue.html_url));
        }

        if (sourceIssueLock !== undefined && sourceIssueLock) {
            await issues.lock(sourceClient, sourceRepositoryOwner, sourceRepositoryName, sourceIssueNumber);
        }

        for (const property in outputs) {
            core.setOutput(property, outputs[property]);
        }

        return outputs;
    } catch (err) {
        core.setFailed(err.message);
        throw err;
    }
}

module.exports = run;
