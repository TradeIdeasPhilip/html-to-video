# html-to-video

This project allows you to create videos using standard web tools like HTML, TypeScript and SVG.

This is a twist on an older project, [html-to-movie](https://github.com/TradeIdeasPhilip/html-to-movie).
That project was a separate program that would convert your html project into a movie.
`html-to-video` is a NPM package that you install into your main project.
It does the same thing, but this newer form should be easier to use.

## Theory of Operation

The idea is ridiculously simple​:

You create an animation with normal web tools.
You can use a web browser to view your work in development.
When you are ready​ to create a movie, you point `html-to-video` to your project's URL.  `html-to-video` is a thin wrapper around puppettier and ffmpeg.  This tool tells your webpage to show a specific frame, it takes a picture and sends that to ffmpeg. It repeats in a loop until all frames are done.​  The result is a *.MOV file.

`html-to-movie` works the same way.