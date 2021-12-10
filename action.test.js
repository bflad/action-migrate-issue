const nock = require('nock');
const path = require('path');

const sourceIssueBody = 'testbody';
const sourceIssueComment = 'This issue has been migrated to {target-issue-url}.';
const sourceIssueHtmlUrl = 'https://github.com/testowner/testsourcerepo/issues/1';
const sourceIssueLabelNameExisting = 'testlabel1'
const sourceIssueLabelNameMissing = 'testlabelmissing'
const sourceIssueLabelPrefixExisting = 'testlabel'
const sourceIssueLabelPrefixMissing = 'testlabelmissing'
const sourceIssueTitle = 'testtitle';
const sourceIssueUser = 'testuser';
const sourceIssueNumber = '1';
const sourceRepo = 'testowner/testsourcerepo';
const targetIssueHtmlUrl = 'https://github.com/testowner/testtargetrepo/issues/1'
const targetIssueNumber = '1'
const targetRepo = 'testowner/testtargetrepo';
const targetRepoName = 'testtargetrepo';
const targetRepoNamePrefix = 'testtarget';
const targetRepoNamePrefixLabelName = 'testlabelprefix/repo';
const targetRepoNamePrefixLabelPrefix = 'testlabelprefix/';
const targetRepoOwner = 'testowner';
const token = 'testtoken';

const outputsEmpty = {
    "target-issue-number": '',
    "target-issue-url": '',
    "target-repository-owner": targetRepoOwner,
    "target-repository-name": targetRepoName,
};
const outputsMigrated = {
    "target-issue-number": targetIssueNumber,
    "target-issue-url": targetIssueHtmlUrl,
    "target-repository-owner": targetRepoOwner,
    "target-repository-name": targetRepoName,
};
const targetIssueHeader = `_This issue was originally opened by @${sourceIssueUser} in ${sourceIssueHtmlUrl} and has been migrated to this repository. The original issue description is below._\n---`;
const mockIssueOpenedRequest = {
    body: `${targetIssueHeader}\n${sourceIssueBody}`,
    title: sourceIssueTitle
};
const mockIssueOpenedResponse = {
    ...mockIssueOpenedRequest,
    html_url: targetIssueHtmlUrl,
    number: targetIssueNumber
};

beforeAll(() => {
    nock.disableNetConnect();
});

beforeEach(() => {
    process.env['GITHUB_REPOSITORY'] = sourceRepo;
    process.env['INPUT_SOURCE-ISSUE-COMMENT'] = sourceIssueComment;
    process.env['INPUT_SOURCE-ISSUE-LOCK'] = 'false';
    process.env['INPUT_SOURCE-ISSUE-NUMBER'] = sourceIssueNumber;
    delete process.env['INPUT_SOURCE-ISSUE-ONLY-LABEL-NAMES'];
    delete process.env['INPUT_SOURCE-ISSUE-ONLY-LABEL-PREFIXES'];
    delete process.env['INPUT_SOURCE-ISSUE-SKIP-LABEL-NAMES'];
    delete process.env['INPUT_SOURCE-ISSUE-SKIP-LABEL-PREFIXES'];
    process.env['INPUT_SOURCE-REPOSITORY-GITHUB-TOKEN'] = token;
    process.env['INPUT_TARGET-ISSUE-HEADER'] = targetIssueHeader;
    delete process.env['INPUT_TARGET-REPOSITORY-NAME'];
    delete process.env['INPUT_TARGET-REPOSITORY-NAME-PREFIX'];
    process.env['INPUT_TARGET-REPOSITORY-NAME-PREFIX-LABEL-NAME'] = targetRepoNamePrefixLabelName;
    delete process.env['INPUT_TARGET-REPOSITORY-NAME-PREFIX-LABEL-PREFIX'];
    process.env['INPUT_TARGET-REPOSITORY-OWNER'] = targetRepoOwner;
    process.env['INPUT_TARGET-REPOSITORY-GITHUB-TOKEN'] = token;
});

describe('action', () => {
    test('default configurations', async () => {
        process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'issue-labeled-payload.json');
        process.env['INPUT_TARGET-REPOSITORY-NAME'] = targetRepoName;

        const scope = nock('https://api.github.com')
            .post(`/repos/${targetRepo}/issues`, mockIssueOpenedRequest)
            .reply(201, mockIssueOpenedResponse)
            .patch(`/repos/${sourceRepo}/issues/${sourceIssueNumber}`, { state: "closed" })
            .reply(200)
            .post(`/repos/${sourceRepo}/issues/${sourceIssueNumber}/comments`, { body: sourceIssueComment.replace('{target-issue-url}', targetIssueHtmlUrl) })
            .reply(201);

        const action = require('./action');
        await expect(await action()).toEqual(outputsMigrated);
        await expect(scope.isDone()).toBeTruthy();
    });

    test('configures source-issue-comment', async () => {
        process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'issue-labeled-payload.json');
        process.env['INPUT_SOURCE-ISSUE-COMMENT'] = '';
        process.env['INPUT_TARGET-REPOSITORY-NAME'] = targetRepoName;

        const scope = nock('https://api.github.com')
            .post(`/repos/${targetRepo}/issues`, mockIssueOpenedRequest)
            .reply(201, mockIssueOpenedResponse)
            .patch(`/repos/${sourceRepo}/issues/${sourceIssueNumber}`, { state: "closed" })
            .reply(200)

        const action = require('./action');
        await expect(await action()).toEqual(outputsMigrated);
        await expect(scope.isDone()).toBeTruthy();
    });

    test('configures source-issue-lock', async () => {
        process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'issue-labeled-payload.json');
        process.env['INPUT_SOURCE-ISSUE-LOCK'] = 'true';
        process.env['INPUT_TARGET-REPOSITORY-NAME'] = targetRepoName;

        const scope = nock('https://api.github.com')
            .post(`/repos/${targetRepo}/issues`, mockIssueOpenedRequest)
            .reply(201, mockIssueOpenedResponse)
            .patch(`/repos/${sourceRepo}/issues/${sourceIssueNumber}`, { state: "closed" })
            .reply(200)
            .post(`/repos/${sourceRepo}/issues/${sourceIssueNumber}/comments`, { body: sourceIssueComment.replace('{target-issue-url}', targetIssueHtmlUrl) })
            .reply(201)
            .put(`/repos/${sourceRepo}/issues/${sourceIssueNumber}/lock`)
            .reply(204);

        const action = require('./action');
        await expect(await action()).toEqual(outputsMigrated);
        await expect(scope.isDone()).toBeTruthy();
    });

    test('configures source-issue-only-label-names with match', async () => {
        process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'issue-labeled-payload.json');
        process.env['INPUT_SOURCE-ISSUE-ONLY-LABEL-NAMES'] = sourceIssueLabelNameExisting;
        process.env['INPUT_TARGET-REPOSITORY-NAME'] = targetRepoName;

        const scope = nock('https://api.github.com')
            .post(`/repos/${targetRepo}/issues`, mockIssueOpenedRequest)
            .reply(201, mockIssueOpenedResponse)
            .patch(`/repos/${sourceRepo}/issues/${sourceIssueNumber}`, { state: "closed" })
            .reply(200)
            .post(`/repos/${sourceRepo}/issues/${sourceIssueNumber}/comments`, { body: sourceIssueComment.replace('{target-issue-url}', targetIssueHtmlUrl) })
            .reply(201);

        const action = require('./action');
        await expect(await action()).toEqual(outputsMigrated);
        await expect(scope.isDone()).toBeTruthy();
    });

    test('configures source-issue-only-label-names without match', async () => {
        process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'issue-labeled-payload.json');
        process.env['INPUT_SOURCE-ISSUE-ONLY-LABEL-NAMES'] = sourceIssueLabelNameMissing;
        process.env['INPUT_TARGET-REPOSITORY-NAME'] = targetRepoName;

        const action = require('./action');
        await expect(await action()).toEqual(outputsEmpty);
    });

    test('configures source-issue-only-label-prefixes with match', async () => {
        process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'issue-labeled-payload.json');
        process.env['INPUT_SOURCE-ISSUE-ONLY-LABEL-PREFIXES'] = sourceIssueLabelPrefixExisting;
        process.env['INPUT_TARGET-REPOSITORY-NAME'] = targetRepoName;

        const scope = nock('https://api.github.com')
            .post(`/repos/${targetRepo}/issues`, mockIssueOpenedRequest)
            .reply(201, mockIssueOpenedResponse)
            .patch(`/repos/${sourceRepo}/issues/${sourceIssueNumber}`, { state: "closed" })
            .reply(200)
            .post(`/repos/${sourceRepo}/issues/${sourceIssueNumber}/comments`, { body: sourceIssueComment.replace('{target-issue-url}', targetIssueHtmlUrl) })
            .reply(201);

        const action = require('./action');
        await expect(await action()).toEqual(outputsMigrated);
        await expect(scope.isDone()).toBeTruthy();
    });

    test('configures source-issue-only-label-prefixes without match', async () => {
        process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'issue-labeled-payload.json');
        process.env['INPUT_SOURCE-ISSUE-ONLY-LABEL-PREFIXES'] = sourceIssueLabelPrefixMissing;
        process.env['INPUT_TARGET-REPOSITORY-NAME'] = targetRepoName;

        const action = require('./action');
        await expect(await action()).toEqual(outputsEmpty);
    });

    test('configures source-issue-skip-label-names with match', async () => {
        process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'issue-labeled-payload.json');
        process.env['INPUT_SOURCE-ISSUE-SKIP-LABEL-NAMES'] = sourceIssueLabelNameExisting;
        process.env['INPUT_TARGET-REPOSITORY-NAME'] = targetRepoName;

        const action = require('./action');
        await expect(await action()).toEqual(outputsEmpty);
    });

    test('configures source-issue-skip-label-names without match', async () => {
        process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'issue-labeled-payload.json');
        process.env['INPUT_SOURCE-ISSUE-SKIP-LABEL-NAMES'] = sourceIssueLabelNameMissing;
        process.env['INPUT_TARGET-REPOSITORY-NAME'] = targetRepoName;

        const scope = nock('https://api.github.com')
            .post(`/repos/${targetRepo}/issues`, mockIssueOpenedRequest)
            .reply(201, mockIssueOpenedResponse)
            .patch(`/repos/${sourceRepo}/issues/${sourceIssueNumber}`, { state: "closed" })
            .reply(200)
            .post(`/repos/${sourceRepo}/issues/${sourceIssueNumber}/comments`, { body: sourceIssueComment.replace('{target-issue-url}', targetIssueHtmlUrl) })
            .reply(201);

        const action = require('./action');
        await expect(await action()).toEqual(outputsMigrated);
        await expect(scope.isDone()).toBeTruthy();
    });

    test('configures source-issue-skip-label-prefixes with match', async () => {
        process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'issue-labeled-payload.json');
        process.env['INPUT_SOURCE-ISSUE-SKIP-LABEL-PREFIXES'] = sourceIssueLabelPrefixExisting;
        process.env['INPUT_TARGET-REPOSITORY-NAME'] = targetRepoName;

        const action = require('./action');
        await expect(await action()).toEqual(outputsEmpty);
    });

    test('configures source-issue-skip-label-prefixes without match', async () => {
        process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'issue-labeled-payload.json');
        process.env['INPUT_SOURCE-ISSUE-SKIP-LABEL-PREFIXES'] = sourceIssueLabelPrefixMissing;
        process.env['INPUT_TARGET-REPOSITORY-NAME'] = targetRepoName;

        const scope = nock('https://api.github.com')
            .post(`/repos/${targetRepo}/issues`, mockIssueOpenedRequest)
            .reply(201, mockIssueOpenedResponse)
            .patch(`/repos/${sourceRepo}/issues/${sourceIssueNumber}`, { state: "closed" })
            .reply(200)
            .post(`/repos/${sourceRepo}/issues/${sourceIssueNumber}/comments`, { body: sourceIssueComment.replace('{target-issue-url}', targetIssueHtmlUrl) })
            .reply(201);

        const action = require('./action');
        await expect(await action()).toEqual(outputsMigrated);
        await expect(scope.isDone()).toBeTruthy();
    });

    test('configures target-issue-header', async () => {
        const updatedTargetIssueHeader = 'another header'

        process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'issue-labeled-payload.json');
        process.env['INPUT_TARGET-ISSUE-HEADER'] = updatedTargetIssueHeader;
        process.env['INPUT_TARGET-REPOSITORY-NAME'] = targetRepoName;

        const updatedMockIssueOpenedRequest = {
            body: `${updatedTargetIssueHeader}
${sourceIssueBody}`,
            title: sourceIssueTitle
        };
        const updatedMockIssueOpenedResponse = {
            ...updatedMockIssueOpenedRequest,
            html_url: targetIssueHtmlUrl,
            number: targetIssueNumber
        };

        const scope = nock('https://api.github.com')
            .post(`/repos/${targetRepo}/issues`, updatedMockIssueOpenedRequest)
            .reply(201, updatedMockIssueOpenedResponse)
            .patch(`/repos/${sourceRepo}/issues/${sourceIssueNumber}`, { state: "closed" })
            .reply(200)
            .post(`/repos/${sourceRepo}/issues/${sourceIssueNumber}/comments`, { body: sourceIssueComment.replace('{target-issue-url}', targetIssueHtmlUrl) })
            .reply(201);

        const action = require('./action');
        await expect(await action()).toEqual(outputsMigrated);
        await expect(scope.isDone()).toBeTruthy();
    });

    test('configures target-repository-name-prefix and target-repository-name-prefix-label-prefix', async () => {
        process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'issue-labeled-payload.json');
        process.env['INPUT_TARGET-REPOSITORY-NAME-PREFIX'] = targetRepoNamePrefix;
        process.env['INPUT_TARGET-REPOSITORY-NAME-PREFIX-LABEL-PREFIX'] = targetRepoNamePrefixLabelPrefix;

        const scope = nock('https://api.github.com')
            .post(`/repos/${targetRepo}/issues`, mockIssueOpenedRequest)
            .reply(201, mockIssueOpenedResponse)
            .patch(`/repos/${sourceRepo}/issues/${sourceIssueNumber}`, { state: "closed" })
            .reply(200)
            .post(`/repos/${sourceRepo}/issues/${sourceIssueNumber}/comments`, { body: sourceIssueComment.replace('{target-issue-url}', targetIssueHtmlUrl) })
            .reply(201);

        const action = require('./action');
        await expect(await action()).toEqual(outputsMigrated);
        await expect(scope.isDone()).toBeTruthy();
    });

    test('errors if missing both target-repository-name and target-repository-name-prefix', async () => {
        process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'issue-labeled-payload.json');

        const action = require('./action');
        await expect(() => action()).rejects.toThrow('must configure target-repository-name or target-repository-name-prefix');
    });

    test('errors if missing target-repository-name-prefix-label-prefix with target-repository-name-prefix', async () => {
        process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'issue-labeled-payload.json');
        process.env['INPUT_TARGET-REPOSITORY-NAME-PREFIX'] = targetRepoNamePrefix;

        const action = require('./action');
        await expect(() => action()).rejects.toThrow('must configure target-repository-name-prefix-label-prefix with target-repository-name-prefix');
    });

    test('retries transient errors', async () => {
        process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'issue-labeled-payload.json');
        process.env['INPUT_TARGET-REPOSITORY-NAME'] = targetRepoName;

        const scope = nock('https://api.github.com')
            .post(`/repos/${targetRepo}/issues`, mockIssueOpenedRequest)
            .reply(500, 'expected transient error')
            .post(`/repos/${targetRepo}/issues`, mockIssueOpenedRequest)
            .reply(201, mockIssueOpenedResponse)
            .patch(`/repos/${sourceRepo}/issues/${sourceIssueNumber}`, { state: "closed" })
            .reply(200)
            .post(`/repos/${sourceRepo}/issues/${sourceIssueNumber}/comments`, { body: sourceIssueComment.replace('{target-issue-url}', targetIssueHtmlUrl) })
            .reply(201);

        const action = require('./action');
        await expect(await action()).toEqual(outputsMigrated);
        await expect(scope.isDone()).toBeTruthy();
    });

    test('retries secondary rate limit errors', async () => {
        process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'issue-labeled-payload.json');
        process.env['INPUT_TARGET-REPOSITORY-NAME'] = targetRepoName;

        const scope = nock('https://api.github.com')
            .post(`/repos/${targetRepo}/issues`, mockIssueOpenedRequest)
            .reply(403, {
                message: "You have exceeded a secondary rate limit and have been temporarily blocked from content creation. Please retry your request again later.",
                documentation_url: "https://docs.github.com/rest/overview/resources-in-the-rest-api#secondary-rate-limits"
            })
            .post(`/repos/${targetRepo}/issues`, mockIssueOpenedRequest)
            .reply(201, mockIssueOpenedResponse)
            .patch(`/repos/${sourceRepo}/issues/${sourceIssueNumber}`, { state: "closed" })
            .reply(200)
            .post(`/repos/${sourceRepo}/issues/${sourceIssueNumber}/comments`, { body: sourceIssueComment.replace('{target-issue-url}', targetIssueHtmlUrl) })
            .reply(201);

        const action = require('./action');
        await expect(await action()).toEqual(outputsMigrated);
        await expect(scope.isDone()).toBeTruthy();
    });

    test('retries rate limit errors', async () => {
        process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'issue-labeled-payload.json');
        process.env['INPUT_TARGET-REPOSITORY-NAME'] = targetRepoName;

        const scope = nock('https://api.github.com')
            .post(`/repos/${targetRepo}/issues`, mockIssueOpenedRequest)
            .reply(429, 'expected rate limit error')
            .post(`/repos/${targetRepo}/issues`, mockIssueOpenedRequest)
            .reply(201, mockIssueOpenedResponse)
            .patch(`/repos/${sourceRepo}/issues/${sourceIssueNumber}`, { state: "closed" })
            .reply(200)
            .post(`/repos/${sourceRepo}/issues/${sourceIssueNumber}/comments`, { body: sourceIssueComment.replace('{target-issue-url}', targetIssueHtmlUrl) })
            .reply(201);

        const action = require('./action');
        await expect(await action()).toEqual(outputsMigrated);
        await expect(scope.isDone()).toBeTruthy();
    });
});
