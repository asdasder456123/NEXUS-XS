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

if command -v curl >/dev/null 2>&1; then
  curl -fL "$URL" -o "$BIN"
elif command -v wget >/dev/null 2>&1; then
  wget -O "$BIN" "$URL"
else
  echo "[cloudflared] Neither curl nor wget is available."
  exit 1
fi

chmod +x "$BIN"

echo "[cloudflared] Installed:"
"$BIN" --version
