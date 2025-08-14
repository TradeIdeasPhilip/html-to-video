import { ChildProcessByStdio, spawn } from "node:child_process";
import Stream from "node:stream";
import { sleep } from "./util.js";

const makeVideoFileName = (extension: "mp4" | "mov", filenamePrefix = "") =>
  `${filenamePrefix}${Date.now()}.${extension}`;

type Running = {
  process: ChildProcessByStdio<Stream.Writable, null, null>;
  done: Promise<void>;
};

/**
 * This creates the *.mp4 file.
 */
export class FfmpegProcess {
  /**
   * FFmpeg settings for H.264 in MP4 container, optimized for YouTube uploads.
   * @remarks
   * - **Quality**: 10-bit `yuv444p10le` and `-crf 14` preserve darker gradients, matching ProRes 422 quality on YouTube after VP9 re-encoding (\~8.8 Mbps).
   * - **File Size**: \~100–200MB/minute, ideal for 8-minute tests (\~0.8–1.6GB).
   * - **Crash Tolerance**: `-movflags frag_keyframe+empty_moov` ensures partial MP4s are playable on Ctrl+C or crashes.
   * - **Speed**: `-preset medium` (\~4–5 frames/s, \~96–120 minutes for 8 minutes) is slower than ProRes but fast enough for workflows.
   * - **YouTube**: `-movflags faststart` optimizes for quick processing and playback.
   */
  static h264Args(
    options: { framesPerSecond?: number; filenamePrefix?: string } = {}
  ) {
    options.framesPerSecond ??= 60;
    options.filenamePrefix ??= "";
    return [
      "-loglevel",
      "warning",
      "-framerate",
      options.framesPerSecond.toString(),
      "-f",
      "image2pipe",
      "-i",
      "-",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "14",
      "-pix_fmt",
      "yuv444p10le",
      "-colorspace",
      "bt709",
      "-color_primaries",
      "bt709",
      "-color_trc",
      "bt709",
      "-color_range",
      "pc",
      "-metadata:s:v:0",
      "color_space=display-p3",
      "-movflags",
      "frag_keyframe+empty_moov+faststart", // Crash-tolerant, CapCut-ready
      "-r",
      options.framesPerSecond.toString(),
      makeVideoFileName("mp4", options.filenamePrefix),
    ];
  }
  /**
   * FFmpeg settings for ProRes 422 in MOV container, optimized for CapCut editing.
   * @remarks
   * - **Quality**: 10-bit `yuv444p10le` and `-profile:v 1` preserve darker gradients (0.08–0.35 multiplier), ideal for editing.
   * - **File Size**: \~3–5GB/minute, suitable for 8-minute tests (\~24–40GB).
   * - **Crash Tolerance**: Intra-frame encoding ensures partial MOVs are playable on Ctrl+C or crashes.
   * - **Speed**: \~6–10 frames/s (\~48–80 minutes for 8 minutes on M2 MacBook Air).
   * - **Use Case**: Essential for heavy editing (e.g., color grading, effects in CapCut) or if YouTube’s compression degrades quality in future projects. Use as a backup for such cases.
   */
  static proresArgs(
    options: {
      framesPerSecond?: number;
      filenamePrefix?: string;
      filesize?: "big" | "small" | "alpha";
    } = {}
  ) {
    options.framesPerSecond ??= 60;
    options.filenamePrefix ??= "";
    options.filesize ??= "small";
    //  // Set to 1 for ProRes 422 (lower bitrate than 422 HQ)  Set to 3 to get ProRes 422 HQ, ~10gig/minute
    let level: string;
    switch (options.filesize) {
      case "big": {
        level = "3";
        break;
      }
      case "alpha": {
        level = "4444";
        break;
      }
      case "small":
      case undefined: {
        level = "3";
        break;
      }
      default: {
        throw new Error("wtf");
      }
    }
    //const level = options.filesize === "big" ? "3" : "1";
    return [
      "-loglevel",
      "warning",
      "-framerate",
      options.framesPerSecond.toString(),
      "-f",
      "image2pipe",
      "-i",
      "-",
      "-c:v",
      "prores_ks",
      "-profile:v",
      level,
      "-pix_fmt",
      "yuv444p10le",
      "-colorspace",
      "bt709",
      "-color_primaries",
      "bt709",
      "-color_trc",
      "bt709",
      "-color_range",
      "pc",
      "-metadata:s:v:0",
      "color_space=display-p3",
      "-r",
      options.framesPerSecond.toString(),
      makeVideoFileName("mov", options.filenamePrefix),
    ];
  }
  #running: Running | undefined;
  readonly #argsForSpawn: string[];
  /**
   * The writer will be created on the first use of this property, and reused as necessary.
   */
  private get process() {
    if (!this.#running) {
      const process = spawn("ffmpeg", this.#argsForSpawn, {
        stdio: ["pipe", "inherit", "inherit"],
        detached: true,
      });
      const promise = Promise.withResolvers<void>();
      process.on("close", (code, signal) => {
        console.info("ffmpeg closed", code, signal);
        promise.resolve();
      });
      this.#running = { process, done: promise.promise };
    }
    return this.#running.process;
  }
  get stdin() {
    return this.process.stdin;
  }
  /**
   * If you don't call this, the resulting file is typically unreadable.
   * (Hopefully I've fixed that by using a different file format.  But call this to be sure.)
   */
  async close() {
    if (!this.#running) {
      return;
    }
    try {
      const debugPause = false;
      if (debugPause) {
        console.log(
          "before await sleep(60000) (draining the output?)",
          new Date().toLocaleString()
        );
        await sleep(60000);
        console.log("after await sleep(60000)", new Date().toLocaleString());
      }
      this.#running.process.stdin.end();
      await this.#running.done;
    } catch (reason) {
      // I really don't want to deal with an error here.
      // Honestly, the only error handler I care about is closing this process.
      // If that fails, nothing else really matters.
      console.error(reason);
    }
  }
  constructor(args = FfmpegProcess.h264Args()) {
    this.#argsForSpawn = args;
    // So it will be one line.
    console.log(JSON.stringify(args));
    this.#registerCleanup();
  }
  static fromCommandLine(
    outputFormat: string | unknown,
    filenamePrefix: string | undefined,
    framesPerSecond:number
  ) {
    filenamePrefix ??="";
    outputFormat ??="small";
    if (!(Number.isSafeInteger(framesPerSecond)&&(framesPerSecond>0))) {
      throw new Error(`Invalid # of frames per second: ${framesPerSecond}.`);
    }
    let args : string[];
    switch (outputFormat) {
      case "small":{
        args = this.h264Args({filenamePrefix,framesPerSecond})
        break;
      }
      case "prores":{
        args=this.proresArgs({filenamePrefix,framesPerSecond,filesize:"small"})
        break;
      }
      case "prores-hq":{
        args=this.proresArgs({filenamePrefix,framesPerSecond,filesize:"big"})
        break;
      }
      case "alpha":{
        args=this.proresArgs({filenamePrefix,framesPerSecond,filesize:"alpha"})
        break;
      }
      default:{
        throw new Error(`Unknown output-type: “${outputFormat}”.`);
      }
    }
    return new this(args);
  }
  #registerCleanup() {
    /*     addEventListener("unhandledrejection", (event) => {
      this.close();
      console.warn(`Unhandled promise rejection: ${event.reason}`);
    });
 */
    // Handle normal process exit via unload event
    /*  addEventListener("unload", () => {
      this.close();
    }); */
  }
}
