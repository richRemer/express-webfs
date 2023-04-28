The `@welib/express-webfs` package exposts [Express.js](https://expressjs.com/)
middleware which exposes a filesystem directory over a REST API.  Analogous to
the [express-static](https://expressjs.com/en/starter/static-files.html)
middleware, but with support for writing.

Quick Start
===========
This example sets up a local web server to serve files from **/var/lib/webfs**.
The server supports HEAD, GET, PUT, and DELETE requests.

```js
import http from "http";
import express from "express";
import webfs from "@welib/express-webfs";

const app = express();

app.use(webfs("/var/lib/webfs"));

http.createServer(app).listen(null, "127.0.0.1", function() {
  const {address, port} = this.address();
  console.info(`listening on ${address}`)
})
```

Options
=======
The **webfs** middleware accepts a second argument of options to configure.  The
following features are supported.

Read-Only Mode
--------------
The **webfs** middleware can be configured in read-only mode to disable PUT and
DELETE requests.

```js
app.use(webfs(root_dir, {readOnly: true}));
```

Simple Update Mode
------------------
Typically, the **webfs** middleware will not allow updates (PUT/DELETE) without
**If-Match** or **If-None-Match** headers to control synchronization between
multiple clients.  If you prefer simpler (but less safe) updates, the middleware
can be configured to allow simple updates.

```js
app.use(webfs(root_dir, {simpleUpdate: true}));
```

Temp File Path
--------------
By default, when PUT requests are handled, the middleware will save the uploaded
resource file to the **.tmp** directory inside the middleware root directory.
This temp directory can be adjusted by setting an alternative absolute path, a
path relative to the target resource, or `null` to save files alongside the
target resource file in the same directory.

```js
app.use(webfs(root_dir, {temp: ".uploads"}));
```

Configuring MIME Types
----------------------
The **webfs** middleware makes use of the popular NPM package
[mime-db](https://www.npmjs.com/package/mime-db) by default.  If you wish to
override this, you can pass in an object in a similar format.

```js
app.use(webfs(root_dir, {
  mime: {
    "text/plain": {
      "charset": "us-ascii",
      "extensions": ["txt", "text"]
    },
    "text/markdown": {
      "extensions": ["md"]
    }
  }
}))
```

Maximum File Size
-----------------
By default, the **webfs** middleware will limit uploaded files to 20 MiB.  This
limit can be configured to be smaller or large, and can be set to Infinity to
remove the limit (not recommended).

```js
app.use(webfs(root_dir, {maxSize: Infinity}));
```
