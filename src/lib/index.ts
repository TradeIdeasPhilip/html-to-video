import { InitializationResult } from "../shared/api";

//export { InitializationResult };

export class HtmlToVideo {
  readonly scenes = new Map<string, () => InitializationResult>();
  addScene(initializer: () => InitializationResult, sceneName: string = "") {
    if (this.scenes.has(sceneName)) {
      throw new Error(`Duplicate scene name “${sceneName}”`);
    }
    this.scenes.set(sceneName, initializer);
  }
}

console.log("😎");
