/**
 * This function exists on the remote system as a global.
 * Call this once before asking for individual frames.
 * @param script A value that is passed on to the remote system.
 * This makes it easy for one html program to implement different scenes.
 * This could be anything, depending on the remote program.
 * Currently one of my programs ignores this and the other uses a string to select from a few well know programs.
 * This value must be JSON friendly to get to the remote process in tact.
 */
export const initScreenCapture = (
  script: unknown
): {
  source: string;
  devicePixelRatio: number;
  firstFrame?: number;
  lastFrame?: number;
  seconds?: number;
} => {
  JSON.stringify(script);
  throw "wtf";
};

/**
 * This function exists on the remote system as a global.
 * Call this to ask it to draw a particular frame.
 * @param t A number between 0 and 1, inclusive.
 * The remote system doesn't know about seconds or frame numbers.
 * It only knows how to draw the system at a time between 0 and 1.
 */
export const showFrame = (t: number) => {
  t;
  throw "wtf";
};
