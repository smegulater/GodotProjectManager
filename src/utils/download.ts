import fs from "fs-extra";
import https from "https";
import { URL } from "url";

export async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    const fetch = (link: string, depth = 0) => {
      if (depth > 5) {
        reject(new Error("Too many redirects"));
        return;
      }

      https
        .get(link, (response) => {
          // 🧭 Handle HTTP redirects
          if (
            response.statusCode &&
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            const redirectUrl = new URL(
              response.headers.location,
              link
            ).toString();
            response.resume(); // prevent hanging sockets
            fetch(redirectUrl, depth + 1);
            return;
          }

          // ❌ Handle non-OK responses
          if (response.statusCode !== 200) {
            reject(
              new Error(`Failed to download file: HTTP ${response.statusCode}`)
            );
            return;
          }

          response.pipe(file);
          file.on("finish", () => file.close(() => resolve()));
        })
        .on("error", (err) => {
          fs.unlink(dest).catch(() => {});
          reject(err);
        });
    };

    fetch(url);
  });
}
