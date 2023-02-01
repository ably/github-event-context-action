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

const logInput = (key, value) => core.info(`${key}: ${typeof value === 'string' ? `"${value}"` : value}`);

// Emit information about the current runtime environment.
// see: https://docs.github.com/en/actions/learn-github-actions/variables#default-environment-variables
[
  'GITHUB_ACTOR',
  'GITHUB_BASE_REF',
  'GITHUB_EVENT_NAME',
  'GITHUB_EVENT_PATH',
  'GITHUB_HEAD_REF',
  'GITHUB_REF',
  'GITHUB_REF_NAME',
  'GITHUB_REF_TYPE',
  'GITHUB_SHA',
].forEach((envName) => {
  const envValue = process.env[envName];
  logInput(envName, envValue);
});

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

// Emit information about more runtime information we're gathering.
logInput('context.eventName', context.eventName);
logInput('context.sha', context.sha);
logInput('ref.type', ref.type);
logInput('ref.name', ref.name);

const shortenSha = (sha) => sha.substring(0, 7);

let { sha } = context;
let url = `https://github.com/${context.repo.owner}/${context.repo.repo}/`;
let title;
let buildMetadata;
if (context.eventName === 'pull_request') {
  const { number } = githubEvent.pull_request;
  sha = githubEvent.pull_request.head.sha;
  url += `pull/${number}/`;
  title = `Pull Request #${number}`;
  buildMetadata = `PR${number}-${shortenSha(sha)}`;
} else if (context.eventName === 'push' && ref !== null && ref.type === 'head' && ref.name === 'main') {
  title = 'Default Branch';
  buildMetadata = shortenSha(sha);
} else if (context.eventName === 'push' && ref !== null && ref.type === 'tag') {
  const { name } = ref;
  url += `releases/tag/${name}/`;
  title = `Tag: ${name}`;
  buildMetadata = name.replace(/[^a-zA-Z0-9]/g, '-');
} else {
  core.setFailed("Error: this action can only be ran on a pull_request, a push to the 'main' branch, or a push of a tag");
  process.exit(1);
}

const emit = (key, value) => {
  core.info(`${key}: ${value}`);
  core.setOutput(key, value);
};

emit('sha', sha);
emit('url', url);
emit('title', title);
emit('build-metadata', buildMetadata);
