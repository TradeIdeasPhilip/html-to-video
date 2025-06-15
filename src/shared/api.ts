/**
 * The initialization function on the client will return a result of this format.
 * 
 * If there are any problems the client will throw and `Error` rather than returning a value.
 */
export type InitializationResult = {
  filename:string;
  firstFrame : number;
  lastFrame : number;
  devicePixelRatio : number;
}
