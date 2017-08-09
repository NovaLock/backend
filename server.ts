"use strict";

import * as Koa from "koa";
import * as bodyParser from "koa-bodyparser";
import * as jsonSerializer from "koa-json";
import * as pino from "pino";
const log = pino({
  level: process.env.NODE_ENV === "dev" ? "debug" :
    (process.env.NODE_ENV === "test" ? "silent" : "info"),
});
import { readFile, writeFile } from "fs";
import { promisify } from "util";
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
import * as uuid from "uuid/v4";

const app = new Koa();

class ApiError extends Error {
  public constructor(code: string, message: string) {
    super(message);
    this.name = code;
  }
}
// tslint:disable-next-line:max-classes-per-file
class Store {
  public users: string[] = [];
  public push = async () =>
    await writeFileAsync(`${__dirname}/store.json`, JSON.stringify(this.users), { encoding: "utf8" })
  public pull = async () =>
    this.users = JSON.parse(await readFileAsync(`${__dirname}/store.json`, { encoding: "utf8" }))
}
const store = new Store();

app.use(jsonSerializer({
  pretty: false,
}));
app.use(async (ctx, next) => {
  try {
    await next();
    ctx.status = 200;
    ctx.body = { result: ctx.body };
  } catch (err) {
    log.error("an error occured", err, ctx, store.users);
    if (err instanceof ApiError) {
      ctx.status = 500;
      ctx.body = {
        error: {
          code: err.name,
          message: err.message,
        },
      };
    } else {
      log.error(err);
      ctx.status = 500;
      ctx.body = {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "an error occured on the server",
        },
      };
    }
  }
});
app.use(bodyParser());
app.use(async (ctx, next) => {
  if (ctx.request.method !== "POST") {
    throw new ApiError("REQUEST_METHOD_MISMATCH", "api request method is not 'POST'");
  } else if (!ctx.request.body || !ctx.request.body.function || !Array.isArray(ctx.request.body.parameters)) {
    throw new ApiError("REQUEST_BODY_NOT_SENT", "request body is not valid");
  } else if (ctx.request.body.version !== "Prometheus/1.0") {
    throw new ApiError("API_VERSION_MISMATCH", "api version mismatches 'Prometheus/1.0'");
  } else {
    ctx.state = ctx.request.header.authorization ?
      (ctx.request.header.authorization as string).substr(7) : undefined;
    ctx.body = await next();
  }
});
app.use(async (ctx) => {
  switch (ctx.request.body.function) {
    default: {
      throw new ApiError("INVALID_FUNCTION", "function is not defined");
    }
    case "init_server": {
      if (store.users.length > 0) {
        throw new ApiError("ALREADY_INITIALIZED", "the lock has already been initialized");
      } else {
        const id = uuid();
        store.users.push(id);
        await store.push();
        return id;
      }
    }
    case "add_user": {
      if (ctx.state && store.users.indexOf(ctx.state) >= 0) {
        const id = uuid();
        store.users.push(id);
        await store.push();
        return id;
      } else {
        throw new ApiError("NOT_AUTHENTICATED",
          "permission not sufficient, either not logged in or not a valid user");
      }
    }
    case "delete_user": {
      if (ctx.state && store.users.indexOf(ctx.state) >= 0) {
        if (ctx.request.body.parameters[0]) {
          const index = store.users.indexOf(ctx.request.body.parameters[0]);
          log.debug("deleting", index, store);
          if (index < 0) {
            throw new ApiError("USER_NOT_FOUND", "the specified user does not exists");
          } else {
            store.users.splice(index, 1);
            await store.push();
            return true;
          }
        } else {
          throw new ApiError("INVALID_PARAMETERS", "parameters are invalid");
        }
      } else {
        throw new ApiError("NOT_AUTHENTICATED",
          "permission not sufficient, either not logged in or not a valid user");
      }
    }
  }
});

export default app;
// tslint:disable-next-line:no-floating-promises
(async () => {
  await store.pull();
  app.listen(process.env.PORT || 3000);
  log.info(`server listening on ${process.env.PORT || 3000}`);
})()
  .catch((err) => {
    log.error(err);
    process.exit(1);
  });
