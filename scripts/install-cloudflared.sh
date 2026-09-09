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
import fs from "node:fs/promises";

const [url, output] = process.argv.slice(2);

const response = await fetch(url);

if (!response.ok) {
  throw new Error(
    `Download failed: ${response.status} ${response.statusText}`,
  );
}

const buffer = Buffer.from(await response.arrayBuffer());

await fs.writeFile(output, buffer);
NODE

chmod +x "$BIN"

echo "[cloudflared] Installed:"
"$BIN" --version
