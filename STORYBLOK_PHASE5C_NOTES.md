# Phase 5C — Experiences add-on photograph

Moves the last image Sanity still served — the photograph beside "Things You
Can Add On" — into Storyblok, behind `STORYBLOK_EXPERIENCES_ENABLED`.

## Why the branch was rebased

The branch was first cut from `fcf40d8`, before the empty-asset fix landed on
`main` (`a34ab40`). Storyblok writes an unset asset field as an object with an
empty filename, and the pre-fix gate read that as a broken image: `accra-food`
picked one up again the moment its story was edited in the Studio, so a preview
built from the original branch reported 12 of 13 tours applied — a failure with
nothing to do with what this phase changes.

Rebasing onto `main` puts the same eight files on top of that fix, which is the
state the branch will be in when it merges. One conflict was resolved:
`package.json`'s `test:content`, where both branches had appended suites. Both
lists were kept.

## Delivery note

Cloudflare did not build the rebased head. A rebase requires a force-push, and
force-push webhooks do not appear to start a Pages build here — the same way an
empty commit does not. Neither shows up in the deployment list. A normal commit
on top is what triggers a build; that is what this file is.

Worth remembering for any future rebase of a branch under preview review.

## Deployments do not reliably follow a push

Observed three times on 8 September 2026, on both `main` and a branch:

- an **empty commit** never produced a build, and never appeared in the
  deployment list at all;
- a **force-push** (the rebase above) never produced one either;
- an ordinary commit usually does, but `7c496f5` sat unbuilt on `main` for
  several minutes until a further push forced it.

A manual action in the Cloudflare dashboard has always worked. The dashboard for
this project offers Retry and Rollback per deployment but no "Create deployment"
button, and both rebuild an *existing* commit — so neither can pick up a new
branch head. That distinction matters: Retry is right when the code is already
correct and only content or an environment variable changed, and wrong when the
code itself has moved.

Worth checking the repository's Settings → Webhooks delivery log if this
continues; it would show whether GitHub is sending the events and how Cloudflare
is responding.
