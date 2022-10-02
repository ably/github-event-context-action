const core = require('@actions/core'); // import * as core from '@actions/core';
const { context } = require('@actions/github');
const fs = require('fs');

const githubEventPath = process.env.GITHUB_EVENT_PATH;
const githubRef = process.env.GITHUB_REF;

if (typeof githubEventPath !== 'string') {
  core.setFailed('GITHUB_EVENT_PATH environment variable not set');
  process.exit(1);
}

if (typeof githubRef !== 'string') {
  core.setFailed('GITHUB_REF environment variable not set');
  process.exit(1);
}

const githubEvent = JSON.parse(fs.readFileSync(githubEventPath, 'utf8'));

const createRef = () => {
  // githubRef is in the form 'refs/heads/branch_name' or 'refs/tags/tag_name'
  const components = githubRef.split('/');

  const refTypePlural = components[1];
  let refType;

  switch (refTypePlural) {
    case 'heads': {
      refType = 'head';
      break;
    }
    case 'tags': {
      refType = 'tag';
      break;
    }
    default: {
      return null;
    }
  }

  return {
    type: refType,
    name: components.slice(2).join('/'),
  };
};
const ref = createRef();

let { sha } = context;
let url = `https://github.com/${context.repo.owner}/${context.repo.repo}/`;
let description;
if (context.eventName === 'pull_request') {
  sha = githubEvent.pull_request.head.sha;
  url += `pull/${githubEvent.pull_request.number}/`;
  description = `Pull Request #${githubEvent.pull_request.number}`;
} else if (context.eventName === 'push' && ref !== null && ref.type === 'head' && ref.name === 'main') {
  description = 'Default Branch';
} else if (context.eventName === 'push' && ref !== null && ref.type === 'tag') {
  url += `releases/tag/${ref.name}/`;
  description = `Tag: ${ref.name}`;
} else {
  core.setFailed("Error: this action can only be ran on a pull_request, a push to the 'main' branch, or a push of a tag");
  process.exit(1);
}

core.debug(`sha: ${sha}`);
core.debug(`url: ${url}`);
core.debug(`description: ${description}`);

core.setOutput('sha', sha);
core.setOutput('url', url);
core.setOutput('description', description);
