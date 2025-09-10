import puppeteer, { Viewport } from "puppeteer";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { FfmpegProcess } from "./ffmpeg.js";
import { initScreenCapture, showFrame } from "./remote-functions.js";
import { Writable } from "stream";

// TODO Move this to ffmpeg.ts
async function smartWrite(
  stdin: NodeJS.WritableStream,
  data: Buffer | Uint8Array | string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const writable = stdin as Writable; // Type assertion
    if (!writable.writable || writable.writableEnded) {
      return reject(new Error("Cannot write to closed or ended stream"));
    }
    const canWrite = writable.write(buffer, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
    if (!canWrite) {
      writable.once("drain", resolve);
    }
  });
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
    .option("source", {
      type: "string",
      description: "If this is present, assert that it matches the web page.",
    })
    .option("output-prefix", {
      type: "string",
      description: "Output file name prefix",
    })
    .option("output-format", {
      type: "string",
      description: "Output file format",
      choices: ["small", "prores", "prores-hq", "alpha"],
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
   * If present, compare this to the same value in the web page.
   *
   * If they don't match, abort before we start.
   * It would be easy to work on the wrong file, especially in development mode.
   */
  const source = argv.source;
  /**
   * The output file name.
   */
  const outputPrefix = argv.outputPrefix;
  /**
   * The output file format
   */
  const outputFormat = argv.outputFormat;

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
    outputPrefix,
    outputFormat,
    zoom,
    viewPort,
  });

  // https://stackoverflow.com/questions/77980537/nodejs-sigint-not-working-as-expected-when-using-puppeteer
  const browser = await puppeteer.launch({
    handleSIGINT: false,
    handleSIGHUP: false,
    handleSIGTERM: false,
  });
  const page = await browser.newPage();
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", (err) => console.error("PAGE ERROR:", err));
  page.on("requestfailed", (request) =>
    console.log("FAILED REQUEST:", request.url())
  );
  await page.goto(url, {
    waitUntil: "networkidle2",
  });
  await page.setViewport(viewPort);
  const fromRemote = await page.evaluate((script: string) => {
    return initScreenCapture(script);
  }, script);
  console.log(fromRemote);
  if (source !== undefined && source !== fromRemote.source) {
    throw new Error(
      `Source mismatch expecting ${source} got ${fromRemote.source}.`
    );
  }
  if (fromRemote.devicePixelRatio !== zoom) {
    throw new Error(
      `Zoom mismatch expecting ${zoom} got ${fromRemote.devicePixelRatio}.`
    );
  }
  console.log("about to new FfmpegProcess", new Date().toLocaleString());
  /**
   * TODO this should be outside of the try / catch so I can do the cleanup in the catch().
   */
  const ffmpegProcess = FfmpegProcess.fromCommandLine(
    outputFormat,
    outputPrefix,
    fps
  );
  let frame = -Infinity;
  try {
    let bailOutEarly = false;
    (["SIGINT", "SIGTERM"] as const).forEach((signal) =>
      process.on(signal, () => {
        console.log(`Bailing out early because of ${signal}.`);
        bailOutEarly = true;
      })
    );
    // TODO attach signal handlers to turn on stop short.
    const slurp = async (start: number, step: number, end: number) => {
      console.log({ start, step, end, slurp: true });
      for (let frameCount = 0; ; frameCount++) {
        frame = start + frameCount * step;
        if (frameCount % 120 == 0) {
          console.info(
            `frameCount = ${frameCount}, frame = ${frame} at ${new Date().toLocaleTimeString()}`
          );
        }
        if (frame > end) {
          break;
        }
        if (bailOutEarly) {
          console.log("bailing out early, just before", frame);
          break;
        }
        await page.evaluate((frame: number) => {
          showFrame(frame);
        }, frame);
        /*
        await page.evaluate(
          () =>
            new Promise((resolve) =>
              window.requestAnimationFrame(() =>
                window.requestAnimationFrame(resolve)
              )
            )
        );
        */
        //await page.waitForTimeout(1000);
        //await new Promise(resolve => setTimeout(resolve, 2000));
        const screenshot = await page.screenshot({
         // type: "jpeg",
         // quality: 90,
          omitBackground: true,
          optimizeForSpeed: true,
        });
        // The problems I've seen the in past all came from Puppeteer, never from writing to ffmpeg.
        //if (frameCount === 130) throw new Error("simulated DO NOT COMMIT");
        await smartWrite(ffmpegProcess.stdin, screenshot);
      }
    };
    if (typeof fromRemote.seconds === "number") {
      const step = (1 / fps) * 1000;
      const start = step / 2;
      const end = fromRemote.seconds * 1000;
      await slurp(start, step, end);
    } else {
      if (
        !(
          typeof fromRemote.firstFrame === "number" &&
          typeof fromRemote.lastFrame === "number"
        )
      ) {
        throw new Error("wtf");
      }
      await slurp(fromRemote.firstFrame, 1, fromRemote.lastFrame);
    }
  } catch (reason) {
    console.warn(
      `Caught something while processing frame ${frame} at ${new Date().toLocaleString()}`,
      reason
    );
  }

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
