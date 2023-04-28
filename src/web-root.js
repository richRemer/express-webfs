import {promises as fs} from "fs";
import {basename, dirname, join, resolve} from "path";
import {mkdirp} from "mkdirp";
import {fullURL, hash} from "@welib/express-webfs/lib";

export class WebRoot {
  #root;
  #temp;

  constructor(root, temp) {
    this.#root = root;
    this.#temp = temp;
  }

  async open(req) {
    const path = this.resolve(req);
    const requestPath = fullURL(req).pathname;
    const filehandle = await fs.open(path);
    const stats = await filehandle.stat();

    return {
      path,
      requestPath,
      stats,
      async close() {
        await filehandle.close();
      },
      createReadStream() {
        return filehandle.createReadStream().on("error", async() => {
          await filehandle.close();
        });
      }
    }
  }

  async openTemporary(req) {
    let stats, filehandle;

    const path = this.resolve(req);
    const actualPath = this.temp(req);
    const requestPath = fullURL(req).pathname;

    try {
      stats = await fs.stat(path);
    } catch (err) {
      if (err.code !== "ENOENT") {
        throw err;
      }
    }

    await mkdirp(dirname(actualPath));

    try {
      filehandle = await fs.open(actualPath, "wx");
    } catch (err) {
      if (err.code === "EEXIST") {
        err.errno = 10;
        err.code = "EBUSY";
        err.message = `EBUSY: resource busy or locked, open '${actualPath}'`;
      }

      throw err;
    }

    return {
      path,
      actualPath,
      requestPath,
      stats,
      async close() {
        try {
          await filehandle.close();
          await mkdirp(dirname(path));
          await fs.rename(actualPath, path);
        } catch (err) {
          await fs.unlink(actualPath);
        }
      },
      createWriteStream() {
        return filehandle.createWriteStream().on("error", async() => {
          await filehandle.close();
        });
      }
    }
  }

  resolve(req) {
    const path = fullURL(req).pathname;
    return join(this.#root, path);
  }

  temp(req) {
    const path = this.resolve(req);
    const temp = this.#temp ? resolve(this.#root, this.#temp) : null;
    return temp
      ? join(temp, `.${hash(path)}`)
      : join(dirname(path), `.${basename(path)}`);
  }

  async stat(req) {
    const path = this.resolve(req);
    return fs.stat(path);
  }

  async unlink(req) {
    const path = this.resolve(req);
    await fs.unlink(path);
  }
}
