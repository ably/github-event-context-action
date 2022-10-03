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
let title;
if (context.eventName === 'pull_request') {
  sha = githubEvent.pull_request.head.sha;
  url += `pull/${githubEvent.pull_request.number}/`;
  title = `Pull Request #${githubEvent.pull_request.number}`;
} else if (context.eventName === 'push' && ref !== null && ref.type === 'head' && ref.name === 'main') {
  title = 'Default Branch';
} else if (context.eventName === 'push' && ref !== null && ref.type === 'tag') {
  url += `releases/tag/${ref.name}/`;
  title = `Tag: ${ref.name}`;
} else {
  core.setFailed("Error: this action can only be ran on a pull_request, a push to the 'main' branch, or a push of a tag");
  process.exit(1);
}

const emit = (key, value) => {
  core.info(`${key}: ${sha}`);
  core.setOutput(key, value);
};

emit('sha', sha);
emit('url', url);
emit('title', title);
