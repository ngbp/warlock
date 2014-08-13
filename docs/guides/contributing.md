# Contributing

The Warlock team needs your help! Here's how you can help us in our mission to create the best build
tool available.

---

## Quickstart!

Please read the rest of this guide before diving in too deeply, but if you're looking for something
to do, here are some suggestions.

* Surf any of the issues lists for the various warlock projects and find an issue tagged "needs pr".
  Then go for it!
* There are some spells we plan on writing, but haven't had the time to create yet. These include:
  [Protractor](https://github.com/angular/protractor), [TypeScript](https://typescript.org),
  [Mocha](http://visionmedia.github.io/mocha/) and [Jasmine](http://jasmine.github.io/) for
  non-browser applications, and [Myth](http://myth.io). There are many more...
* Add a new feature to Warlock. Some ideas on our roadmap are: context-sensitive help information
  for tasks and flows; customizable file ordering; CDN translation of app and vendor files; deploy
    tasks for common endpoints (e.g. [Amazon S3][s3], [OpenShift][os], [CloudFoundry][cf], [Elastic
    Beanstalk][eb], and others); and more sophisticated command-line control of the engine itself.
    We're going to be pretty selective both in the features that make it into the engine as well as
    the manner by which they are done, so be sure to talk to us first.

[eb]: http://aws.amazon.com/elasticbeanstalk
[s3]: http://aws.amazon.com/s3
[os]: http://openshift.redhat.com
[cf]: http://www.gopivotal.com/platform-as-a-service/pivotal-cf

## Non-Code Contributions

Just because can't - or don't want to - write code for Warlock doesn't mean you can't contribute!
Here is a short list of some ways you can still help:

* Help us write better [documentation](https://github.com/ngbp/warlock/tree/master/docs). Things are
  missing, incomplete, and in need of improvement. Fork the repo and submit a pull request with your
  suggestions.
* Design a logo! Right now, our typographic logo doesn't really convey the magic of the tool. If
  you've got some design skill to spare, how about creating a modern, flat, colorful brand for
  Warlock?

Also, you can file issues!

### Filing Issues

If you encounter a problem, please let us know by filing an issue with the project on GitHub. If
your issue is with a particular plugin or spell, like
[`spell-webapp`](https://github.com/ngbp/spell-webapp), then please file the issue there.
Otherwise, you can file it with the [main Warlock issues
page](https://github.com/ngbp/warlock/issues).

When filing an issue, please keep a couple of things in mind:

* Please don't file duplicates. Search around the issue tracker to see if there's a report of a
  similar problem first.
* Explain your problem as clearly and simply as possible. Let us know the exact steps that we can
  follow to reproduce the problem.
* Post a simple, reproducible scenario. If we can't duplicate the error, it's unlikely we'll be able
  to fix it, so please let us know what configuration, etc., is needed to make the issue appear. But
  *make it simple*! Please don't post a 100-line `warlock.json` file.

Failure to follow the rules may lead to riots. Or humiliation. Maybe both.

### Join the Discussion

Did you know we have a [mailing list](https://groups.google.com/forum/#!forum/warlock-engine)? Feel
free to post questions or suggestions or ideas - or just tell us how you're using Warlock. Please
don't get us spammed; you won't like us when we're spammed.

You can also use the [`#warlock`](https://twitter.com/search?q=%23warlock&src=typd) Twitter hashtag
to ask questions or to give suggestions; we're hoping this leads to some hilarious misunderstandings
about the powers we cannot confirm we possess.

## Improving the Tool

First, install [Node.js](http://nodejs.org) and [NPM](http://npmjs.org); this is probably already
the case. Then:

* Install the command-line tool globally: `$ npm install -g warlock-cli`
* [Fork the `warlock` repository](https://github.com/ngbp/warlock/fork).
* Clone it to your local machine: `$ git clone https://github.com/<yourname>/warlock`.

Now you're ready to get started. We recommend working on "feature branches", where you create a new
branch for each feature you're developing in order to keep the source tree and your pull requests as
clean and clear as possible.

```bash
$ cd warlock
$ git checkout -b my-feature-name
$ npm install
```

Now you're ready to hack away!

## Submitting Pull Requests

We *love* pull requests. If you have a solid fix to an issue or a new feature you'd like us to
consider, please submit a pull request to appropriate repository. However, all pull requests must
follow a few simple guidelines:

* One logical feature per commit. When you submit a pull request, it should *not* include more than
  one commit. If it does, please squash them first.
* Commit messages (and therefore PR titles) must follow the format `type(component): short message`
  and be absolutely no longer than 100 characters in length. 80 characters or less is preferable.
  
This style is very similar to those for AngularJS, so check out their [contributing
guide](https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md).

### A Quick Note - Style

Some of us are a little anal, but we don't have a formal style guide. Please check out the existing
code and try to adhere to it as much as possible. If you notice anything inconsistent, please let us
know - or submit a pull request!

To be helpful, here are a few quick guidelines:

* Don't use tabs - ever. Always indent two spaces.
* No trailing whitespace - ever (except when necessary, e.g. for markdown).
* Use single quotes most of the time. For some string concatenation in CoffeeScript, double-quotes
  are allowed if it contributes to readability.
* Love the comments! It's never a bad idea to note what you're doing; just be brief, be clear,
  and put it on the *preceding line*.

### Another Quick Note - Merging

Of you're part of the Warlock team and have been given the ability to write to our repositories,
please do so with care, and keep in mind the following:

* Nothing should be committed or merged that hasn't been reviewed by others through a pull request.
* Pull requests should *not* be merged automatically by GitHub. The branch should be pulled, merged,
  and tested locally and then pushed to GitHub, maintaining the author. The Pull request can then be
  closed with a reference in the comments to the commit that closed it.
* That's *commit*. Singular. No merge or push to the `master` branch or any release branch should
  *ever* be more than one commit. Squash if necessary.

As a side note, if you'd like to become a member of the team, show us what you can do. Help out in
the discussions, fix a some issues, or write some features. Trust us - we'll take notice.

## Writing Spells

One of the best ways to help out is by writing spells. Check out [the
guide](#/guide/crafting-spells) if you'd like to learn more and checkout the Quickstart, above, if
you're looking for some ideas.

