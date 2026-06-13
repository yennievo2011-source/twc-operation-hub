import http from "node:http";
import { app } from "../server.js";

export function request(method, path, payload) {
  return new Promise((resolve, reject) => {
    const srv = app.listen(0, () => {
      const port = srv.address().port;
      const data = payload ? JSON.stringify(payload) : null;
      const req = http.request(
        {
          host: "localhost",
          port,
          path,
          method,
          headers: data
            ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
            : {},
        },
        (res) => {
          let body = "";
          res.on("data", (c) => (body += c));
          res.on("end", () => {
            srv.close();
            let parsed = null;
            try { parsed = JSON.parse(body); } catch { parsed = body; }
            resolve({ status: res.statusCode, body: parsed });
          });
        }
      );
      req.on("error", (e) => { srv.close(); reject(e); });
      if (data) req.write(data);
      req.end();
    });
  });
}

export const get = (path) => request("GET", path);
export const post = (path, payload) => request("POST", path, payload || {});
