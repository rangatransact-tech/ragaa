#!/usr/bin/env bash
# Turns your drone clips into the frame sequences the site scrolls through.
#
#   1. Put the clips in ./originals/scenes/ named after the scene:
#        sangeeth.mp4   haldi.mp4   wedding.mp4   hyderabad.mp4
#      (any of .mp4 / .mov; each ideally 6-12 s of steady forward flight)
#   2. Optional trimming, in seconds:  SANGEETH_START=3 SANGEETH_LEN=9 ...
#   3. Run:  bash tools/prepare-scenes.sh
#
# Writes public/media/scenes/<scene>/0001.webp ... and manifest.json.
# Scenes you haven't supplied yet keep using the real-time 3D world.
set -euo pipefail
cd "$(dirname "$0")/.."
FF=${FFMPEG:-ffmpeg}
command -v "$FF" >/dev/null || { echo "ffmpeg not found. Mac: brew install ffmpeg"; exit 1; }

IN=originals/scenes
OUT=public/media/scenes
FPS=${SCENE_FPS:-15}        # frames per second of footage kept
HEIGHT=${SCENE_HEIGHT:-720} # frame height in pixels
QUALITY=${SCENE_QUALITY:-66}
mkdir -p "$OUT"

entries=()
for id in sangeeth haldi wedding hyderabad; do
  src=$(ls "$IN/$id".{mp4,mov,MP4,MOV} 2>/dev/null | head -n1 || true)
  [ -z "$src" ] && continue
  up=$(echo "$id" | tr '[:lower:]' '[:upper:]')
  start_var="${up}_START"; len_var="${up}_LEN"
  start=${!start_var:-0}; len=${!len_var:-}
  echo "Scene $id from $src"
  rm -rf "${OUT:?}/$id"; mkdir -p "$OUT/$id"
  args=(-v error -y -ss "$start" -i "$src")
  [ -n "$len" ] && args+=(-t "$len")
  "$FF" "${args[@]}" -an \
    -vf "fps=$FPS,scale=-2:$HEIGHT:flags=lanczos,format=yuv420p" \
    -c:v libwebp -quality "$QUALITY" -compression_level 4 "$OUT/$id/%04d.webp"
  n=$(ls "$OUT/$id" | wc -l | tr -d ' ')
  echo "  $n frames, $(du -sh "$OUT/$id" | cut -f1)"
  entries+=("{\"id\":\"$id\",\"frames\":$n,\"fps\":$FPS,\"ext\":\"webp\"}")
done

( IFS=,; echo "{\"scenes\":[${entries[*]:-}]}" ) > "$OUT/manifest.json"
echo "Wrote $OUT/manifest.json"
echo "Deployment size (keep under 100 MB):"; du -sh public
