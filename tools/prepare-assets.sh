#!/usr/bin/env bash
# Optimises your original photos and film into the site.
#
#   1. Put the originals in ./originals/ (this folder is git-ignored):
#        ring.jpg  blue.jpg  birds.jpg  court.jpg  charminar.jpg
#        save-the-date.mp4   (the 267 MB backwaters film; any name ending .mp4 works)
#   2. Run:  bash tools/prepare-assets.sh
#
# Needs ffmpeg (Mac: `brew install ffmpeg`). Writes to public/assets,
# public/media and public/og. Safe to run again.
set -euo pipefail
cd "$(dirname "$0")/.."

IN=originals
FF=${FFMPEG:-ffmpeg}
command -v "$FF" >/dev/null || { echo "ffmpeg not found. Mac: brew install ffmpeg"; exit 1; }
mkdir -p public/assets public/media public/og

jpeg() { # jpeg <in> <out> <long-edge>
  local src=$1 out=$2 edge=$3
  # -q:v 4 is roughly quality 78
  "$FF" -v error -y -i "$src" \
    -vf "scale='if(gte(iw,ih),min($edge,iw),-2)':'if(gte(iw,ih),-2,min($edge,ih))':flags=lanczos,format=yuvj420p" \
    -q:v 4 -map_metadata -1 "$out"
  echo "  $out  $(du -h "$out" | cut -f1)"
}

echo "Photos"
[ -f "$IN/ring.jpg" ]      && jpeg "$IN/ring.jpg"      public/assets/ring.jpg 1500
for p in blue birds court charminar; do
  [ -f "$IN/$p.jpg" ] && jpeg "$IN/$p.jpg" "public/assets/$p.jpg" 1100
done

# --- Our story highlight: ~16 s from 0:22, 24 fps, 1280x720, H.264 high, no audio.
# The film's end card shows the wrong muhurtham time; we never go near it.
VIDEO=$(ls "$IN"/*.mp4 2>/dev/null | head -n1 || true)
if [ -n "$VIDEO" ]; then
  START=${STORY_START:-22}
  LEN=${STORY_LEN:-16}
  echo "Story clip from $VIDEO (start ${START}s, ${LEN}s)"
  "$FF" -v error -y -ss "$START" -i "$VIDEO" -t "$LEN" -an \
    -vf "fps=24,scale=1280:720:flags=lanczos,fade=t=in:st=0:d=0.8,fade=t=out:st=$(echo "$LEN - 0.9" | bc):d=0.9,format=yuv420p" \
    -c:v libx264 -profile:v high -preset slow -crf 26 -movflags +faststart public/media/story.mp4
  "$FF" -v error -y -ss "$((START + 4))" -i "$VIDEO" -frames:v 1 \
    -vf "scale=1280:720:flags=lanczos,format=yuvj420p" -q:v 4 public/media/story-poster.jpg
  echo "  public/media/story.mp4  $(du -h public/media/story.mp4 | cut -f1)"
fi

# --- WhatsApp link previews: ring photo + gold monogram + date.
if [ -f "$IN/ring.jpg" ]; then
  echo "Link preview images"
  # the site's final photo look: a touch of sepia, clean off-white light (not yellow)
  TONE="colorchannelmixer=rr=0.915:rg=0.108:rb=0.026:gr=0.049:gg=0.955:gb=0.023:br=0.038:bg=0.075:bb=0.899,eq=contrast=1.08:brightness=-0.02:saturation=1.05,lutrgb=r='max(val,20)':g='max(val,14)':b='max(val,10)'"
  # rings sit at 48% across and 55.6% down the original photo
  "$FF" -v error -y -i "$IN/ring.jpg" -i tools/overlays/og-1200x630.png -filter_complex \
    "[0]scale=1200:-2,crop=1200:630:0:'min(ih-630,max(0,ih*0.5556-345))',$TONE[p];[p][1]overlay=0:0,format=yuvj420p" \
    -q:v 3 public/og/og-1200x630.jpg
  "$FF" -v error -y -i "$IN/ring.jpg" -i tools/overlays/og-1080.png -filter_complex \
    "[0]scale=1080:-2,crop=1080:1080:0:'min(ih-1080,max(0,ih*0.5556-560))',$TONE[p];[p][1]overlay=0:0,format=yuvj420p" \
    -q:v 3 public/og/og-square.jpg
  echo "  public/og/og-1200x630.jpg, public/og/og-square.jpg"
fi

echo
echo "Deployment size (keep under 100 MB):"
du -sh public
