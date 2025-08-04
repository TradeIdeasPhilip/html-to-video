# html-to-video

This project allows you to create videos using standard web tools like HTML, TypeScript and SVG.

This is a fresh start on an older project, [html-to-movie](https://github.com/TradeIdeasPhilip/html-to-movie).
I switched from Deno to node.js in large part because Deno's Puppeteer would hang on me a lot.
The node version is more reliable.

## Theory of Operation

The idea is ridiculously simple​:

You create an animation with normal web tools.
You can use a web browser to view your work in development.
When you are ready​ to create a movie, you point `html-to-video` to your project's URL. `html-to-video` is a thin wrapper around Puppeteer and ffmpeg. This tool tells your webpage to show a specific frame, it takes a picture and sends that to ffmpeg. It repeats in a loop until all frames are done.​ The result is a \*.MOV file.

## Project Structure (and status)

This tool comes in two parts.
This project takes care of recording from a web page.

A related npm library package will help you make your web page work with this tool.
It handles the protocol.

Originally I was planning to put that library and this tool into the same NPM package.
I changed my mind for a number of reasons, mostly so you don't need to install multiple copies of the Puppeteer package including chromium.
This codebase still contains a lot of references to the library that needs to be removed.

And I need to create that library.
I've got a lot of prototypes, but no library yet.
I keep copying the code from one project to the next, slowly modifying it.
The protocol seems to be stable now, so this would be a good time to publish a library as an NPM package.

## "Slurp"

The word "slurp" found throughout the code refers to a specific version of the protocol.
Originally there were several versions, possibly and overlapping spectrum of constantly evolving protocols.
Slurp was the winner and it's the only version I'm copying into this version of the code.

In the initialization phase the webpage will tell this program what its preferred size is.
There can be overridden from the command line.
But the web page knows **how much** content it has, just like it knows **what** content it has.

The web page can advertise that it contains a specific number of seconds.
This is the preferred way to do things.
This program defaults to 60 fps with a command line override.
Specific frames are requested using the number of milliseconds from the start of the content.
E.g. 0 for the very beginning, 1000 for one second in.
Add 1000/60, 16.666666666666668, to advance t by one frame (at 60 fps)

I think I'm going to get rid of the other option.
It gave the web page more control but it doesn't really make sense.
The web page should just say the number of seconds and let this program do the rest.
As long as I'm at it, change the initial request from seconds to milliseconds, like I use everywhere else. **TODO**

Notice the **fencepost** issue.
If I ask for one second of video at 10 frames per second, which frames should I ask for?

- 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9
- 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0?
- 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0?
- 0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95

After some trial and error I decided that the last option works the best.
So at the standard 60 fps our first frame is always at time 8.333333333333334.

## ffmpeg dependency

You need to download ffmpeg and put it into your path.

At one time I looked into ffmpeg.wasm.
That would avoid the need to download a separate program.
That offers the same basic functionality but it can be downloaded as an npm package.

That actually works, as you can see [here](https://github.com/TradeIdeasPhilip/handwriting-effect?tab=readme-ov-file#handwriting-effect).
That's still a prototype, but it creates bespoke animations completely in a webpage using ffmpeg.wasm.

Unfortunately the wasm version added a lot of complications and performance issues and didn't scale well.

But that's okay.
It's not hard to install ffmpeg.
Most recently I used brew on my Mac and the process was uneventful.

## Command line

### As I've been using it (sample)

```
philipsmolen@MacBookAir html-to-video % cd output
philipsmolen@MacBookAir output % pwd
/Users/philipsmolen/Documents/fun-git/html-to-video/output
philipsmolen@MacBookAir output % node  ../dist/cli/index.js 'http://localhost:5173/fourier-smackdown.html?index=24'
```

and let it go!

**TODO** Publish something so you don't need to run fourier-smackdown.html in a local debugger.
For now, https://github.com/TradeIdeasPhilip/random-svg-tests is what I'm running.

### Built in help

```
philipsmolen@MacBookAir output % node  ../dist/cli/index.js
Supply a url on the command line to render it.
-h for more command line options.
See https::/⁉⁉ for more information.
philipsmolen@MacBookAir output % node  ../dist/cli/index.js -h
Options:
     --version  Show version number                                   [boolean]
     --script   JavaScript to run on the page            [string] [default: ""]
     --width    Video width in pixels                  [number] [default: 3840]
     --height   Video height in pixels                 [number] [default: 2160]
     --zoom     Number of css pixels / video pixels.  See devicePixelRatio.
                                                          [number] [default: 1]
     --fps      Frames per second                        [number] [default: 60]
     --source   If this is present, assert that it matches the web page.
                                                                       [string]
     --output   Output video file name                                 [string]
 -h, --help     Show help                                             [boolean]
philipsmolen@MacBookAir output %
```

**TODO** Should `https::/⁉⁉` point back here?
