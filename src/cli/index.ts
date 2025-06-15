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

function main() {
  // TODO Read the arguments from the command line.

  // Test the work so far.
  const now = new Date().toString();
  console.log({ now, url, script, width, height, fps, outputFileName });
}

// TODO run main
