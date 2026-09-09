#!/bin/sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
BIN_DIR="$ROOT/.cloudflared-bin"
BIN="$BIN_DIR/cloudflared"

mkdir -p "$BIN_DIR"

ARCH="$(uname -m)"

case "$ARCH" in
  x86_64|amd64)
    URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
    ;;
  aarch64|arm64)
    URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
    ;;
  *)
    echo "[cloudflared] Unsupported Linux architecture: $ARCH"
    exit 1
    ;;
esac

echo "[cloudflared] Installing for Linux architecture: $ARCH"
echo "[cloudflared] Downloading from: $URL"

node - "$URL" "$BIN" <<'NODE'
const fs = require("node:fs");
const { Readable } = require("node:stream");

const [url, output] = process.argv.slice(2);

const response = await fetch(url);

if (!response.ok || !response.body) {
  throw new Error(`Download failed: ${response.status} ${response.statusText}`);
}

const file = fs.createWriteStream(output);

await Readable.fromWeb(response.body).pipeTo(
  new WritableStream({
    write(chunk) {
      return new Promise((resolve, reject) => {
        if (file.write(chunk)) {
          resolve();
        } else {
          file.once("drain", resolve);
          file.once("error", reject);
        }
      });
    },
    close() {
      return new Promise((resolve, reject) => {
        file.end(() => resolve());
        file.once("error", reject);
      });
    },
    abort(error) {
      file.destroy(error);
    },
  }),
);
NODE

chmod +x "$BIN"

echo "[cloudflared] Installed:"
"$BIN" --version
