const nock = require('nock')
const { Octokit } = require("@octokit/rest");

const issues = require('./issues')

const client = new Octokit({
    auth: 'testtoken',
    log: console,
});

beforeAll(() => {
    nock.disableNetConnect();
});

describe('close', () => {
    test('success', async () => {
        const scope = nock('https://api.github.com')
            .patch(`/repos/testowner/testrepo/issues/1`, { state: 'closed' })
            .reply(200);

        await expect(await issues.close(client, 'testowner', 'testrepo', 1)).resolve;
        await expect(scope.isDone()).toBeTruthy();
    });

    test('throws error', async () => {
        const scope = nock('https://api.github.com')
            .patch(`/repos/testowner/testrepo/issues/1`, { state: 'closed' })
            .reply(500, 'expected error');

        await expect(issues.close(client, 'testowner', 'testrepo', 1)).rejects.toThrow('expected error');
        await expect(scope.isDone()).toBeTruthy();
    });
});

describe('comment', () => {
    test('success', async () => {
        const scope = nock('https://api.github.com')
            .post(`/repos/testowner/testrepo/issues/1/comments`, { body: 'testbody' })
            .reply(201);

        await expect(await issues.comment(client, 'testowner', 'testrepo', 1, 'testbody')).resolve;
        await expect(scope.isDone()).toBeTruthy();
    });

    test('throws error', async () => {
        const scope = nock('https://api.github.com')
            .post(`/repos/testowner/testrepo/issues/1/comments`, { body: 'testbody' })
            .reply(500, 'expected error');

        await expect(issues.comment(client, 'testowner', 'testrepo', 1, 'testbody')).rejects.toThrow('expected error');
        await expect(scope.isDone()).toBeTruthy();
    });
});

describe('lock', () => {
    test('success', async () => {
        const scope = nock('https://api.github.com')
            .put(`/repos/testowner/testrepo/issues/1/lock`)
            .reply(204);

        await expect(await issues.lock(client, 'testowner', 'testrepo', 1)).resolve;
        await expect(scope.isDone()).toBeTruthy();
    });

    test('throws error', async () => {
        const scope = nock('https://api.github.com')
            .put(`/repos/testowner/testrepo/issues/1/lock`)
            .reply(500, 'expected error');

        await expect(issues.lock(client, 'testowner', 'testrepo', 1)).rejects.toThrow('expected error');
        await expect(scope.isDone()).toBeTruthy();
    });
});

describe('open', () => {
    test('success', async () => {
        const scope = nock('https://api.github.com')
            .post(`/repos/testowner/testrepo/issues`)
            .reply(201);

        await expect(await issues.open(client, 'testowner', 'testrepo', 'testtitle', 'testbody')).resolve;
        await expect(scope.isDone()).toBeTruthy();
    });

    test('throws error', async () => {
        const scope = nock('https://api.github.com')
            .post(`/repos/testowner/testrepo/issues`)
            .reply(500, 'expected error');

        await expect(issues.open(client, 'testowner', 'testrepo', 'testtitle', 'testbody')).rejects.toThrow('expected error');
        await expect(scope.isDone()).toBeTruthy();
    });
});
