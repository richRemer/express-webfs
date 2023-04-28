import {extname} from "path";
import {match, noneMatch, hash} from "@welib/express-webfs/lib";

export function GET(root, mimedb) {
  const head = sendHead(root, mimedb);

  return async function GET(req, res, next) {
    head(req, res, async file => {
      file.createReadStream().pipe(res).on("end", close);

      async function close() {
        await file.close();
      }
    });
  }
}

export function HEAD(root, mimedb) {
  const head = sendHead(root, mimedb);

  return async function HEAD(req, res, next) {
    head(req, res, async file => {
      await file.close();
      res.sendStatus(200);
    });
  }
}

function peekStream() {
  return new TransformStream({
    transform(chunk, encoding, done) {
      this.push()
    }
  })
}

export function PUT(root, simpleUpdate) {
  return async function PUT(req, res, next) {
    let file;

    try {
      file = await root.openTemporary(req);

      const etag = file.stats ? hash(file.requestPath, file.stats.mtime) : null;

      if (!simpleUpdate && !req.get("If-Match") && !req.get("If-None-Match")) {
        res.sendStatus(428);
      } else if (!match(req, etag)) {
        res.sendStatus(412);
      } else if (!noneMatch(req, etag)) {
        res.sendStatus(412);
      } else {
        // TODO: re-encode data based on mimedb and client Content-Type
        req.pipe(file.createWriteStream())
          .on("finish", close)
          .on("error", close);

        async function close(err) {
          await file.close();

          if (err) {
            res.sendStatus(500);
          } else if (file.stats) {
            res.sendStatus(204);
          } else {
            res.sendStatus(201);
          }
        }
      }
    } catch (err) {
      handleError(res, err);
      if (file) await file.close();
    }
  }
}

export function DELETE(root, simpleUpdate) {
  return async function DELETE(req, res, next) {
    try {
      const path = fullURL(req).pathname;
      const {mtime} = await root.stat(req);
      const etag = hash(path, mtime);

      if (!simpleUpdate && !req.get("If-Match")) {
        res.sendStatus(428);
      } else if (!match(req, etag)) {
        res.sendStatus(412);
      } else {
        // TODO: clean up empty directories after unlink
        await root.unlink(req);
        res.sendStatus(204);
      }
    } catch (err) {
      handleError(res, err);
    }
  }
}

function handleError(res, err) {
  switch (err.code) {
    case "ENOENT":  res.sendStatus(404); break;
    case "EACCES":  res.sendStatus(403); break;
    case "EEXIST":  res.sendStatus(500); break;
    case "EBUSY":   res.sendStatus(503); break;
    default:
      console.error(process.env.DEBUG ? err.stack : err.message);
      res.sendStatus(500);
  }
}

function sendHead(root, mimedb) {
  return async function sendHead(req, res, next) {
    let file;

    try {
      file = await root.open(req);

      const ext = extname(file.requestPath).slice(1);
      const type = mimedb[ext]?.content || "application/octet-stream";
      const etag = hash(file.requestPath, file.stats.mtime);

      if (!match(req, etag)) {
        await file.close();
        res.sendStatus(412);
      } else if (!noneMatch(req, etag)) {
        await file.close();
        res.sendStatus(304);
      } else {
        res.set("ETag", etag);
        res.set("Date", file.stats.mtime);
        res.set("Content-Type", type);

        await next(file);
      }
    } catch (err) {
      handleError(res, err);
      if (file) await file.close();
    }
  }
}
