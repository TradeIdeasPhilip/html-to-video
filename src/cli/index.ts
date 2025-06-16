import yargs from "yargs";
import { hideBin } from "yargs/helpers";

/**
 * Where to get the content.
 *
 * Override this on the command like with --url
 */
let url = "http://localhost:5173/";
/**
 * Some files contain multiple scripts.
 * Specify the name of the script you want to run.
 *
 * Override this on the command line with --script
 */
let script = "";

/**
 * The width of the output video.
 * Defaults to 4k.
 * This should be a positive integer.
 *
 * This might not be the same as the height in "pixels" in the browser.
 * check `devicePixelRatio`.
 *
 * Override this on the command line with --width
 */
let width = 3840;

/**
 * The width of the output video.
 * Defaults to 4k.
 * This should be a positive integer.
 *
 * This might not be the same as the width in "pixels" in the browser.
 * check `devicePixelRatio`.
 *
 * Override this on the command line with --height
 */
let height = 2160;

/**
 * The framerate in frames per second.
 * This should be a positive number.
 *
 * Override this on the command line with --fps
 */
let fps = 60;

/**
 * The output file name.
 *
 * Override this on the command line with --output-file-name
 */
let outputFileName = "my video.mov";

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("url", {
      type: "string",
      description: "URL of the HTML page to convert",
      default: url,
    })
    .option("script", {
      type: "string",
      description: "JavaScript to run on the page",
      default: script,
    })
    .option("width", {
      type: "number",
      description: "Video width in pixels",
      default: width,
    })
    .option("height", {
      type: "number",
      description: "Video height in pixels",
      default: height,
    })
    .option("fps", {
      type: "number",
      description: "Frames per second",
      default: fps,
    })
    .option("output", {
      type: "string",
      description: "Output video file name",
      default: outputFileName,
    })
    .help()
    .alias("help", "h")
    .parse();

  // Update variables with parsed values
  url = argv.url;
  script = argv.script;
  width = argv.width;
  height = argv.height;
  fps = argv.fps;
  outputFileName = argv.output;

  // Test the work so far.
  const now = new Date().toString();
  console.log({ now, url, script, width, height, fps, outputFileName });
}

// Run main if this is the main module
if (import.meta.url === new URL(import.meta.url).href) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}