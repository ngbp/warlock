---
{
  "priority": 1
}
---

# Tutorial

This page will guide you through some core concepts, installation, and usage. After reading this
page, you should be up and running with the latest alpha of Warlock!

---

## Can I talk you out of it?

As many of you will know, Warlock is based on [ngbp](http://github.com/ngbp/ngbp), but it is a
complete rewrite that no longer uses Grunt. The idea is to have a generic, flexible build system
that can support any kind of structure or process, but using a "convention over configuration"
philosophy to encourage the best practices found in the current version of ngbp. AngularJS, SASS,
LESS, CoffeeScript, and their kin are plugins to this core build system. In many ways, Warlock is
like [Grunt][grunt], [Gulp][gulp], and [Yeoman][yeoman] - but on steroids.

As it is written completely from scratch, Warlock is still very incomplete. It is capable of
building code, but there are some bells and whistles from the current ngbp that are incomplete (such
as watching for changes) and some that are missing entirely (such as unit testing). We'll get there,
but so far it's just [me](http://joshdavidmiller.com) in my spare time; I have found it more
difficult to find contributors for Warlock than ngbp due to my own time constraints and because the
Warlock engine uses [Node streams][nodeStreams] (similar to [Gulp][gulp]) and the concepts used in
the backend can be a little confusing at first. I mention all of this to say that it's currently in
active development, the API's changing quite a bit day-to-day, and there's no documentation (except
this page).

If you're feeling adventurous, keep reading. Make no mistake, however, that Warlock certainly has
bugs and missing features. I take no responsibility for the storm of wild ostriches that may seize
your home or office to swallow up the code you try process with Warlock. **It will be buggy.**

## Warlock 101

You've decided to keep reading - woo! Warlock certainly needs testers. Before we begin, let's talk
about what Warlock is.

The goal of the project is to create a generic, flexible build system that can support any kind of
structure or process, but using a "convention over configuration" philosophy to encourage best
practices. As such, Warlock is a strong departure from ngbp. Warlock is a build system that a
project that *looks like ngbp* could use; that is, version 0.4 of ngbp will use Warlock instead of
Grunt.

Warlock is very high-level; Unlike Grunt or Gulp, getting started requires no configuration
whatsoever - there is no `Gruntfile` to write - and unlike Yeoman, Warlock doesn't output one
either. Because it emphasizes convention and best practices, configuration need only occur when one
wants to deviate from the norm. As you'll see later in this guide, said configuration is very
straightforward. 

Warlock should save developers time.

Since web applications follow predictable patterns, any reasonable build tool should already know
about them. We shouldn't have to describe to our build tool what a web app *is* every time we create
one. This was the initial motivation for creating ngbp, but we quickly started running into trouble.
While they all *look* the same, different projects use different helpers: some use straight CSS,
while others use [SASS][sass], [LESS][less], or [Myth][myth]; some use straight JavaScript, while
others use [CoffeeScript][coffeescript] or [TypeScript][typescript]; some use HTML, others
[Jade][jade]. Including all of these into a boilerplate quickly creates a very complex build
process that is difficult to change or upgrade that leads to a lot of cruft. Instead of helping to
save time and effort, the boilerplate becomes a kludge. There should be a way to specify what
features we want on the fly, enabling and disabling them as we need to, and the build tool should
"just know" how to handle them - because web apps follow predictable patterns.

So we need an intelligent tool that understands what we're trying to do and will, for the vast
majority of cases, *just do it*.

## Flows

A "flow" is a path through which some form of data traverses during your build; in a web
application, there are flows for JavaScript, CSS, HTML, and assets. Flows are in turn comprised of a
series of steps. The JavaScript flow follows these steps:

1. Read in files from disk based on glob pattern.
2. Lint each to ensure they follow our project's convention.
3. Concatenate the files into one file.
4. Minify the file to reduce file size.
5. Write the file back to disk based on the project's target.

The steps above are a little oversimplified and make no distinction between build and compile tasks,
but should show what counts as a step. Steps (technically [streams][nodeStreams]) are like tasks in
Grunt and streams in Gulp, except that they are handled automatically by Warlock. Everything is
completely configurable, but the core philosophy of Warlock is that out of the box everything needed
to manage a client-side web application based on accepted best practices should "just work" - no
Gruntfile needed.

A project can contain any number of flows, which originate either from plugins (called "spells") or
from the user. Creating these is straightforward, but beyond the scope of this document.

## Enhancing the Core with Spells

As I said, "spells" is just a fancy name for "plugins" to fit the theme. They are analogous to Grunt
or Gulp tasks and in many ways to Yeoman generators (less scaffolding - for now), but the key
difference is that they work out of the box with no configuration. Using `npm install
warlock-spell-coffeescript` will do everything necessary so that
[CoffeeScript](http://coffeescript.org) files are automatically linted, compiled, and then treated
like your other JavaScript files. The concept works similarly with LESS, SASS, Jade, and anything
else that your project may want to handle a certain way.

This works by building on a base. The flows discussed in the previous section are part of the
[`webapp` spell][webappSpell] and define everything necessary to manage a standard client-side web
application. Spells like [`coffeescript`][coffeeSpell] can be used to augment the base with
additional functionality. Here's a diagram that may help to show this:

[![Warlock Flows and Spells Concepts](https://docs.google.com/drawings/d/1CIE680YNionj7KbqQHJu6Wj0s7CMkq0UC62TqSZnpCs/pub?w=960&h=540)](https://docs.google.com/drawings/d/1CIE680YNionj7KbqQHJu6Wj0s7CMkq0UC62TqSZnpCs/edit?usp=sharing)

As you can see from the diagram, flows can exist on their own, starting and ending on the file
system, or they can be merged into other flows. For example, once CoffeeScript files are linted and
compiled, they are no different than any other JavaScript source file in our project, so we add them
to the JavaScript flow at the point that makes the most sense - and then the CoffeeScript flow is
done because that the files started out as CoffeeScript no longer matters. This is possible because
regardless how they start, **web applications have a finite number of types at the end of the
build.**

The internals of spells are mostly straightforward, but are beyond the scope of this quick guide. If
you're curious what's going on behind the scenes, check out the base [`webapp`][webappSpell] and
then see how the [`coffeescript`][coffeeSpell] adds to it. There are [other spells][spells] too.

## Getting Started

Now that you have some idea of what Warlock is and does, let's give it a spin.

Warlock is available through NPM and, following the pattern of Grunt and Gulp, has a command-line
tool you should install (use `sudo` if you're on Linux):

```bash
$ npm install -g warlock-cli
```

Now let's check out one of the [examples][warlockExamples]. As virtually all readers of this guide
will be coming from ngbp, let's use that example:

```bash
$ git clone git@github.com:ngbp/ngbp -b warlock example-angular
$ cd example-angular
$ npm install
$ bower install
```

You'll now have the application all ready to go; let's dive into some detail. Here's how it
currently looks:

```
example-angular/
|-- node_modules/
|-- src/
|   |-- app/
|   |   |-- home/
|   |   |   |-- home.js
|   |   |   |-- home.css
|   |   |   |-- home.tpl.html
|   |   |-- about/
|   |   |   |-- about.js
|   |   |   |-- about.tpl.html
|   |   |-- app.js
|   |   |-- app.css
|   |   |-- app.spec.js
|   |-- assets/
|   |-- index.html
|-- vendor/
|-- bower.json
|-- package.json
|-- warlock.json
```

This structure isn't new to ngbp users, though there are a few subtle (and mostly irrelevant)
changes. The real difference is that there is no `Gruntfile.js` and no `build.config.js`. Formerly,
these two files *were* the engine behind ngbp. Now, that engine and its power are hidden away in its
NPM dependencies. If you take a look at its `package.json` file, you will see it depends on
`warlock-spell-angular`, which also brings in `warlock` and `warlock-spell-webapp` as [peer
dependencies](http://blog.nodejs.org/2013/02/07/peer-dependencies/). `warlock` is the core build
engine, `warlock-spell-webapp` provides basic support for managing client-side web applications, and
`warlock-spell-angular` adds support for AngularJS to said web apps.

The best practice conventions come from these NPM packages, while any overrides go in
`warlock.json`:

```json
{
  "globs": {
    "vendor": {
      "js": [
        "vendor/angular/angular.js",
        "vendor/angular-bootstrap/ui-bootstrap-tpls.min.js",
        "vendor/placeholders/angular-placeholders-0.0.1-SNAPSHOT.min.js",
        "vendor/angular-ui-router/release/angular-ui-router.js"
      ]
    }
  }
}
```

It is indeed quite short as the defaults should suffice in most cases. Here, we want to include a
vendor JavaScript file that is particular to our application and so instruct Warlock to pick it up
when it processes the vendor files. (Unfortunately, most of these configuration points, while
functional, are not documented yet.)

The configuration brevity is due to another goal of Warlock: it should get out of our way. This
repository has very few files that are not part of our application. A key advantage of this approach
is that you can update Warlock simply by running `npm update` - no more merging configs and juggling
grunt files. This alone is a great victory.

Well, what are we waiting for? Let's build this mo-fo! Simply run:

```bash
$ warlock
```

Voila! You will then have "build" and "bin" directories just like with the current ngbp. Inside, you
will find your built app, with `index.html` runnable right from your local machine - no server
required. Magic!

Now let's say we want to add [CoffeeScript][coffeescript] support to our app. We just install the
[spell][coffeeSpell] for it:

```bash
$ npm install --save warlock-spell-coffeescript
```

That's it! CoffeeScript will now be handled appropriately. To test it, delete `src/app/app.js` and
replace it with a `src/app/app.coffee` file containing this:

```coffee
mod = angular.module 'ngBoilerplate', [
  'ui.router'
  'templates'
  'ngBoilerplate.home'
  'ngBoilerplate.about'
]

mod.config ( $stateProvider, $urlRouterProvider ) ->
  $urlRouterProvider.otherwise '/home'

mod.controller 'AppCtrl', ( $scope, $location ) ->
  $scope.$on '$stateChangeSuccess', ( event, toState ) ->
    if toState.data.pageTitle?
      $scope.pageTitle = '#{toState.data.pageTitle} | ngBoilerplate'
```

And now run the `warlock` command again and then open `build/index.html` in your browser. Everything
still works - the CoffeeScript is processed and compiled right alongside the JavaScript. Boom! You
could follow the same procedure to add support for [LESS][less] or [SASS][sass] - just check out the
other [spells][spells].

That should be enough of a trial run to get some initial feedback. If you want to explore a little
bit, try `warlock --help` to see the additional options; not all are implemented just yet.

Have fun! And beware the ostriches.

[gulp]: http://gulpjs.com
[grunt]: http://gruntjs.com
[yeoman]: http://yeoman.io
[coffeescript]: http://coffeescript.org
[typescript]: http://www.typescriptlang.org/
[sass]: http://sass-lang.com
[less]: http://lesscss.org
[jade]: http://jade-lang.org
[warlockExamples]: https://github.com/ngbp?query=example
[nodeStreams]: http://nodejs.org/api/stream.html
[webappSpell]: https://github.com/ngbp/spell-webapp
[coffeeSpell]: https://github.com/ngbp/spell-coffeescript
[spells]: https://github.com/ngbp?query=spell


