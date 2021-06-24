# action-migrate-issue

GitHub Action to migrate an issue by opening a new issue in target repository with the source issue description and closing the issue in current repository. Closing the issue, instead of transferring the issue, preserves the original issue in searches of the source repository.

## Usage

Migrate issue to specific target repository when specific label is added:

```yaml
name: Labeled Issues

on:
  issues:
    types: [labeled]

permissions:
  issues: write

jobs:
  migrate:
    if: github.event.label.name == 'migrate-issue'
    runs-on: ubuntu-latest
    steps:
      - uses: bflad/action-migrate-issue@v1
        with:
          target-repository-name: 'target-repo'
          target-repository-github-token: ${{ secrets.TARGET_REPO_GITHUB_TOKEN }}
```

Migrate issue using prefix-based labeling (e.g. given `plugin/example` label, migrate to `plugin-example` repository):

```yaml
jobs:
  migrate:
    if: startsWith(github.event.label.name, 'plugin/')
    runs-on: ubuntu-latest
    steps:
      - uses: bflad/action-migrate-issue@v1
        with:
          target-repository-name-prefix: 'plugin-'
          target-repository-name-prefix-label-prefix: 'plugin/'
          target-repository-github-token: ${{ secrets.TARGET_REPO_GITHUB_TOKEN }}
```

### Permissions

When using [workflow `GITHUB_TOKEN`](https://docs.github.com/en/actions/reference/authentication-in-a-workflow#permissions-for-the-github_token):

- `issues: write`: Close, comment, lock, and/or open.

When not using [workflow `GITHUB_TOKEN`](https://docs.github.com/en/actions/reference/authentication-in-a-workflow#permissions-for-the-github_token):

- [Personal Access Token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) with `repo` scope.

### Inputs

| Input                                        | Description                                                                                                                                                                                      | Default                                                                                                                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `source-issue-comment`                       | Comment to leave on source issue. If empty, no comment is left. The `{target-issue-url}` placeholder can be used to inject the opened issue URL.                                                 | `This issue has been migrated to {target-issue-url}.`                                                                                                                                                           |
| `source-issue-lock`                          | Whether to lock the source issue.                                                                                                                                                                | `false`                                                                                                                                                                                                         |
| `source-issue-number`                        | Number of source issue.                                                                                                                                                                          | `${{ github.event.issues.number }}`                                                                                                                                                                             |
| `source-issue-only-label-names`              | Names of source issue labels that must be present to trigger migration. Multiple values can be configured with newlines.                                                                         |                                                                                                                                                                                                                 |
| `source-issue-only-label-prefixes`           | Name prefixes of source issue labels that must be present to trigger migration. Multiple values can be configured with newlines.                                                                 |                                                                                                                                                                                                                 |
| `source-issue-skip-label-names`              | Names of source issue labels that will skip migration if present. Multiple values can be configured with newlines.                                                                               |                                                                                                                                                                                                                 |
| `source-issue-skip-label-prefixes`           | Name prefixes of source issue labels that will skip migration if present. Multiple values can be configured with newlines.                                                                       |                                                                                                                                                                                                                 |
| `source-repository-github-token`             | GitHub token to perform actions on source repository.                                                                                                                                            | `${{ github.token }}`                                                                                                                                                                                           |
| `target-issue-header`                        | Header text to add to target issue description.                                                                                                                                                  | `_This issue was originally opened by @${{ github.event.issue.user.login }} in ${{ github.event.issue.html_url }} and has been migrated to this repository. The original issue description is below._\n---\n` |
| `target-repository-github-token`             | GitHub token to perform actions on target repository.                                                                                                                                            |                                                                                                                                                                                                                 |
| `target-repository-name`                     | Name of target repository. Conflicts with `target-repository-name-prefix`.                                                                                                                       |                                                                                                                                                                                                                 |
| `target-repository-name-prefix`              | Name prefix of target repository. Conflicts with `target-repository-name`. Uses `target-repository-name-prefix-label-name` and `target-repository-name-prefix-label-prefix` to create full name. |                                                                                                                                                                                                                 |
| `target-repository-name-prefix-label-name`   | Name of label to determine target repository name. Used with `target-repository-name-prefix` and `target-repository-name-prefix-label-prefix` to create full name.                               | `${{ github.event.label.name }}`                                                                                                                                                                                |
| `target-repository-name-prefix-label-prefix` | Prefix to remove from label to determine target repository name. Used with `target-repository-name-prefix` and `target-repository-name-prefix-label-name` to create full name.                   |                                                                                                                                                                                                                 |
| `target-repository-owner`                    | Owner of target repository.                                                                                                                                                                      | `${{ github.repository_owner }}`                                                                                                                                                                                |

### Outputs

| Output                    | Description                                   |
| ------------------------- | --------------------------------------------- |
| `target-issue-number`     | Issue number opened in target repository.     |
| `target-issue-url`        | URL of the issue opened in target repository. |
| `target-repository-name`  | Name of target repository.                    |
| `target-repository-owner` | Owner of target repository.                   |

## Development

Install the dependencies

```bash
npm install
```

Run the tests :heavy_check_mark:

```bash
npm run test
```

### Packaging for Distribution

Packaging assembles the code into one file (`dist/index.js`) that can be checked in to Git, enabling fast and reliable execution and preventing the need to check in `node_modules`.

Run prepare

```bash
npm run prepare
```
