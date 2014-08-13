---
{
  "name": "ngbp to Warlock"
}
---

# ngbp to Warlock

ngbp has outgrown its Grunt-based build script and is transitioning to a new tool called Warlock.
Here's what it means for the project.

---

## The Problems with the Current Build Toolchain

Generally, front-end development is a bit of a mess. For any project of any scale, a web developer
need not only be familiar with HTML, CSS, and JavaScript - not to mention the various frameworks
and/or preprocessors she may be using - but must also be familiar with build tools like Grunt or
Gulp, and to begin to use any of those build tools effectively, she must also have some knowledge of
Node and NPM, and to utilize any client-side libraries she will also need something like Bower,
and... and that's just the start of any project with only the most general of needs.

And all of this is just to *process* a web app for distribution!

Originally, ngbp was created by [Josh David Miller](http://joshdavidmiller.com) as a personal
exercise; he wanted a quick set of code with which to help him and his clients kickstart new
AngularJS projects.  He included the core tools he used, like Bower, LESS, Bootstrap, and
CoffeeScript, without much regard for different projects. But the project quickly gained traction
within the broader AngularJS community, who helped shepherd it in a direction more immediately
usable on more generic projects.

But all was not well in the Land of Oz. The challenges grew exponentially with the community.
Diverse interests began vying for inclusion of their projects' eccentricities: why do we include
CoffeeScript but not TypeScript? LESS but not SASS? What if we use neither? What about templating
HTML from Jade or Haml?

Incorporating any additional features into ngbp increases the size of the configuration,
unnecessarily complicates it, and introduces a great deal of kruft to the process for those who
*don't* make use of these features.

Right from the start, Josh filed the first issue on ngbp: how to cleanly upgrade. Since it's
configuration-based, one *could* just pull down the latest `Gruntfile.js` using a few git commands.
But not only is that a manual process, many *internal* changes become *breaking* changes and must me
manually resolved, but also any customizations to the build the developer makes would be wiped out -
unless she chose to plod through file diffs to manually merge them. But there isn't a clean, easy
way to manage upgrades to a third-party, comprehensive build script.

In addition, Grunt operates like traditional "make" tools: it takes files from one place, does
something to each, and then puts them another place. With increasingly complex client-side code,
this starts to become quite cumbersome. For example, with CoffeeScript files for AngularJS, we may
need (as ngbp does) to lint them, compile them, pre-minify/annotate them, concatenate them, and then
minify them. That is five separate reads and four separate writes to the file system for the same
data. Far more efficient is to read the files in *once*, process them through as many steps as we
need, and then write them back out *once*.

But it's not just efficiency. If we take Jade templates, we need to process them as templates (to
add dynamic script tags, say) and then compile the processed files to HTML. That requires *three
directories* of files with Grunt: first, the original source files; second the compiled templates,
since we cannot overwrite our source files; and a third to house the built HTML, since it doesn't
make much sense to overwrite them in-place due to their differing extensions and potentially
different numbers (e.g. with includes). This is silly, and is part of the reason why so many
developers are switching to a Gulp-based build process - but that doesn't solve any of the other
problems detailed here.

And though its undoubtedly *possible* to accomplish most of the goals discussed here with a
Grunt-based process - or even better, with a Gulp-based process - it would no doubt result in an
unwieldy set of unwieldy configuration files. As it stands, ngbp's `Gruntfile.js` already has more
than 600 lines with a few dozen additional lines of JSON configuration, through which developers
have no choice but to wade. For both new and experienced front-end developers as well as for both
new and existing project team members, this is just asking too much. It wastes manpower, it wastes
dollars, and it's frustrating.

**The bottom line:** developers should be able to focus on *development* without having to become
build tool experts.

## Introducing Warlock

The goal of the project is to create a generic, flexible build system that can support any kind of
structure or process, but using a "convention over configuration" philosophy to encourage best
practices. As such, Warlock is very high-level.

Unlike Grunt or Gulp, getting started requires no configuration whatsoever. There is no Gruntfile to
write and, unlike Yeoman, Warlock doesn't output one either. Because it emphasizes convention and
best practices, configuration need only occur when one wants to deviate from the norm to, for
example, account for your project's eccentricities.

Since Warlock has a command-line tool and is distributed through NPM, using and upgrading it is very
straightforward. If you'd like, take a minute to read through the brief [work-in-progress
tutorial](http://docs.getwarlock.com/#/guide/tutorial) to give it a try. For example, once you have
a new Warlock project, you can build it by running the command:

```
$ warlock
```

Want to add CoffeeScript and LESS?

```
$ npm install --save-dev warlock-spell-coffeescript warlock-spell-less
```

And that's it. Warlock now know what to do (by default) with CoffeeScript and LESS files. Again,
there's no need to configure anything unless you want to stray from convention, which even then is
done simply through an optional `warlock.json` file. Aside from `package.json`, your project has no
extraneous files - just your code.

## What this means for ngbp

Hopefully you see the value in Warlock (if not, let us know why). But what does it mean for ngbp?
Actually, not much.

### ngbp Structure

The ngbp structure and its best-practices approach to developing and maintaining client-side web
applications will *not* be affected by the move to Warlock. If you take a look at that
[work-in-progress tutorial](http://docs.getwarlock.com/#/guide/tutorial), you'll see that it uses
ngbp as its example. Check it out!

### New Features

The real change to ngbp is in adding new features, like support for Jade or TypeScript. Instead of
submitting PRs to the ngbp repository, developers will create and publish a new "spell", distributed
through NPM, that anyone can use. We've already done this with CoffeeScript, LESS, and SASS. Even
AngularJS is just a plugin.

Tactically, this means we've gone ahead and closed all the outstanding feature requests for ngbp and
added them to this wishlist:

* TypeScript Support
* Jade Support

If you'd like to contribute, feel free to tackle one of the above. Before you do so, it may be a
good idea to coordinate with the team to ensure everyone's not working on the same thing and to get
a little guidance on the best approach since Warlock is so new.

## Maintenance Mode

## Resources

- Announcements Mailing List
- Google Group
- Documentation (work in progress)

