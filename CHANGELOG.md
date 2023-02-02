# Changelog

## [1.1.0](https://github.com/ably/github-event-context-action/releases/tag/v1.1.0)

This release adds an additional output to this Action called `build-metadata`, in a format that is compatible for use as [build metadata](https://semver.org/#spec-item-10) in a semantically versioned 'number' (the text after the `+`).

Also added is support for use in a job where the workflow was triggered manually (a `workflow_dispatch` event), which is a typical scenario where the `build-metadata` output would subsequently be consumed.
