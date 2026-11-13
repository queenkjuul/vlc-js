/**
 * Util functions borrowed from ffmpeg.wasm: https://github.com/ffmpegwasm/ffmpeg.wasm/blob/main/packages/util/src/index.ts
 * 
 * 
 * MIT License

Copyright (c) 2019 Jerome Wu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

/**
 * importScript dynamically import a script, useful when you
 * want to use different versions of VLC.js based on environment.
 *
 * Example:
 *
 * ```ts
 * await importScript("http://localhost:3000/vlc/vlc.js");
 * ```
 */
export const importScript = async (url: string): Promise<void> =>
  new Promise((resolve) => {
    const script = document.createElement("script");
    const eventHandler = () => {
      script.removeEventListener("load", eventHandler);
      resolve();
    };
    script.src = url;
    script.type = "text/javascript";
    script.addEventListener("load", eventHandler);
    document.getElementsByTagName("head")[0].appendChild(script);
  });

/**
 * toBlobURL fetches data from an URL and return a blob URL.
 *
 * Example:
 *
 * ```ts
 * await toBlobURL("http://localhost:3000/vlc/vlc.js", "text/javascript");
 * ```
 */
export const toBlobURL = async (url: string, mimeType: string): Promise<string> => {
  const buf = await (await fetch(url)).arrayBuffer();
  const blob = new Blob([buf], { type: mimeType });
  return URL.createObjectURL(blob);
};
