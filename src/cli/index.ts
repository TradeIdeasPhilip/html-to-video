import puppeteer, { Viewport } from "puppeteer";
import yargs, { number } from "yargs";
import { hideBin } from "yargs/helpers";
import { FfmpegProcess } from "./ffmpeg";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

async function smartWrite(
  stdin: NodeJS.WritableStream,
  data: Buffer | Uint8Array | string
): Promise<void> {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const readable = Readable.from([buffer]);
  await pipeline(readable, stdin);
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("script", {
      type: "string",
      description: "JavaScript to run on the page",
      default: "",
    })
    .option("width", {
      type: "number",
      description: "Video width in pixels",
      default: 3840,
    })
    .option("height", {
      type: "number",
      description: "Video height in pixels",
      default: 2160,
    })
    .option("zoom", {
      type: "number",
      description:
        "Number of css pixels / video pixels.  See devicePixelRatio.",
      default: 1,
    })
    .option("fps", {
      type: "number",
      description: "Frames per second",
      default: 60,
    })
    .option("output", {
      type: "string",
      description: "Output video file name",
    })
    .help()
    .alias("help", "h")
    .parse();

  if (argv._.length != 1) {
    console.error(
      "Supply a url on the command line to render it.\n-h for more command line options.\nSee https::/⁉⁉ for more information."
    );
    process.exit(1);
  }
  // Update variables with parsed values
  /**
   * Where to get the content.
   *
   * Override this on the command like with --url
   */
  const url = argv._[0].toString();
  /**
   * Some files contain multiple scripts.
   * Specify the name of the script you want to run.
   *
   * This is typically the empty string as most config data lands in the ? part of the url.
   */
  const script = argv.script;
  /**
   * The width of the output video.
   * Defaults to 4k.
   * This should be a positive integer.
   *
   * This might not be the same as the height in "css pixels" in the browser.
   * check `devicePixelRatio`.
   */
  const width = argv.width;
  /**
   * The width of the output video.
   * Defaults to 4k.
   * This should be a positive integer.
   *
   * This might not be the same as the width in "css pixels" in the browser.
   * check `devicePixelRatio`.
   */
  const height = argv.height;
  /**
   * `devicePixelRatio`
   */
  const zoom = argv.zoom;
  /**
   * The framerate in frames per second.
   * This should be a positive number.
   */
  const fps = argv.fps;
  /**
   * The output file name.
   */
  const outputFileName = argv.output;

  // Test the work so far.
  const now = new Date().toString();
  const viewPort: Viewport = {
    height: Math.round(height / zoom),
    width: Math.round(width / zoom),
    deviceScaleFactor: zoom,
  };
  console.log({
    now,
    url,
    script,
    width,
    height,
    fps,
    outputFileName,
    zoom,
    viewPort,
  });

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: "networkidle2",
  });
  await page.setViewport(viewPort);
  console.log("about to new FfmpegProcess", new Date().toLocaleString());
  const ffmpegProcess = new FfmpegProcess(
    FfmpegProcess.h264Args({
      framesPerSecond: fps,
      filenamePrefix: outputFileName,
    })
  );
  console.log("about to page.screenshot", new Date().toLocaleString());
  const screenshot = await page.screenshot({ optimizeForSpeed: true });

  console.log("about to smartWrite", new Date().toLocaleString());
  await smartWrite(ffmpegProcess.stdin, screenshot);
  console.log("about to ffmpegProcess.close", new Date().toLocaleString());
  await ffmpegProcess.close();
  console.log("about to browser.close", new Date().toLocaleString());
  await browser.close();
  console.log("about to exit", new Date().toLocaleString());
}

// Run main if this is the main module
if (import.meta.url === new URL(import.meta.url).href) {
  main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
}
