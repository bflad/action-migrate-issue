async function close(client, owner, repo, issueNumber) {
    const issue = `${owner}/${repo}#${issueNumber}`

    client.log.info(`Closing issue: ${issue}`);

    try {
        const { data } = await client.rest.issues.update({
            owner: owner,
            repo: repo,
            issue_number: issueNumber,
            state: 'closed',
        });

        client.log.info(`Closed issue: ${issue}`);

        return data;
    } catch (err) {
        client.log.error(`Unable to close issue (${issue}): ${err}`);
        throw err;
    }
}

async function comment(client, owner, repo, issueNumber, body) {
    const issue = `${owner}/${repo}#${issueNumber}`

    client.log.info(`Commenting on issue: ${issue}`);

    try {
        const { data } = await client.rest.issues.createComment({
            owner: owner,
            repo: repo,
            issue_number: issueNumber,
            body: body,
        });

        client.log.info(`Commented on issue: ${issue}`);

        return data;
    } catch (err) {
        client.log.error(`Unable to comment on issue (${issue}): ${err}`);
        throw err;
    }
}

async function lock(client, owner, repo, issueNumber) {
    const issue = `${owner}/${repo}#${issueNumber}`

    client.log.info(`Locking issue: ${issue}`);

    try {
        const { data } = await client.rest.issues.lock({
            owner: owner,
            repo: repo,
            issue_number: issueNumber,
        });

        client.log.info(`Locked issue: ${issue}`);

        return data;
    } catch (err) {
        client.log.error(`Unable to lock issue (${issue}): ${err}`);
        throw err;
    }
}

async function open(client, owner, repo, title, body) {
    const repository = `${owner}/${repo}`

    client.log.info(`Opening issue in repository: ${repository}`);

    try {
        const { data } = await client.rest.issues.create({
            owner: owner,
            repo: repo,
            title: title,
            body: body,
        });

        const issue = `${repository}/${data.number}`

        client.log.info(`Opened issue: ${issue}`);

        return data;
    } catch (err) {
        client.log.error(`Unable to open issue in repository (${repository}): ${err}`);
        throw err;
    }
}

exports.close = close;
exports.comment = comment;
exports.lock = lock;
exports.open = open;
