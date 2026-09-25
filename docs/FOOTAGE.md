# Real footage for the flight

The site now plays real drone footage as you scroll. Each scene is one clip. Scrolling moves through it frame by frame, so the camera only moves when the guest scrolls, and scenes dissolve into each other through light. Any scene without footage yet falls back to the real-time 3D world, so you can add scenes one at a time.

| File (in `originals/scenes/`) | Scene | What the clip should show |
|---|---|---|
| `sangeeth.mp4` | Sangeeth, Friday night | Moonlit night; people in glamorous western wear (sequins, velvet, metallics) dancing under the moon with warm string lights or lanterns. The drone glides forward low over the crowd, toward the dance floor. |
| `haldi.mp4` | Haldi, Saturday morning | Golden desert dunes in morning sun; people in yellow ethnic wear throwing clouds of yellow, marigold and pink gulal. The drone flies forward through the drifting colour. |
| `wedding.mp4` | Wedding, Sunday at dawn | The real **Shore Temple, Mahabalipuram** at sunrise, the sea behind it; guests in silks and veshtis gathered in the temple courtyard, marigold garlands, a mandapam. The drone approaches from inland toward the temple as the sun rises. |
| `hyderabad.mp4` | See you in Hyderabad | The drone flies toward and through the arches of the **Charminar**, with the old-city bazaar below. |

**What makes a clip work well**
- 6–12 seconds of **steady forward motion** (no cuts, no reversing, no whip pans). Forward flight is what makes scrolling feel like flying.
- Landscape 1920×1080 or larger. The site crops the centre on phones, so keep the subject centred.
- No text, logos or watermarks, and no end cards.
- Don't show the two of you. The brief keeps your own outfits a surprise.

## Three ways to get the clips

### 1. Real stock drone footage (most real for the landmarks)
Search licensed stock libraries such as Artgrid, Storyblocks, Pond5, Shutterstock or Getty, or the free Pexels and Pixabay (check each clip's licence).
- "Shore Temple Mahabalipuram drone sunrise" or "Mamallapuram temple aerial"
- "Charminar drone", "Charminar aerial fly through", "Hyderabad old city drone"
- "Holi colours desert", "Haldi ceremony colours", "people throwing gulal slow motion"
- "night party dancing string lights drone", "sangeet night dance aerial"

Real crowds from stock libraries won't be your guests, but they read as real celebrations. For the temple and the Charminar, real footage is the only way the buildings will look exactly right.

### 2. AI-generated video (people and mood exactly as you imagine)
Generate with a video model (Google Veo, Kling, Runway Gen-4, Sora or similar) at 16:9, the highest resolution available, and around 8 seconds. Ready prompts:

**Sangeeth**
> Cinematic FPV drone shot at night, gliding slowly forward low above an outdoor Indian sangeet celebration on a hilltop lawn under a full moon, snow-capped Himalayan peaks glowing in moonlight in the distance, guests in glamorous western evening wear with sequins, velvet and metallic fabrics dancing joyfully, warm fairy lights and lanterns strung overhead, soft haze, photorealistic, shot on ARRI, shallow depth of field, natural motion, no text.

**Haldi**
> Cinematic FPV drone shot in golden morning light, flying forward low over sweeping Thar desert sand dunes where a group of Indian friends in yellow and marigold ethnic clothes throw clouds of yellow, orange and pink gulal powder into the air, powder drifting and glowing in backlight, laughter and celebration, long dune shadows, photorealistic, 4K, natural motion, no text.

**Wedding**
> Cinematic FPV drone shot at sunrise, flying forward from the beach toward the 8th-century Shore Temple at Mahabalipuram, Tamil Nadu: two pyramidal granite towers (the taller one on the sea side), weathered carved stone, a low compound wall lined with Nandi sculptures, the Bay of Bengal behind with the sun just rising over the sea; wedding guests in Kanjivaram silk sarees and white veshtis gathered in the courtyard with marigold garlands and a flower-decked mandapam, soft dawn haze, photorealistic, 4K, natural motion, no text.

**Hyderabad**
> Cinematic FPV drone shot flying forward over the bustling old-city bazaar of Hyderabad toward the Charminar at golden hour, rising and passing through one of its great arches, four minarets glowing warm, pigeons taking flight, photorealistic, 4K, natural motion, no text.

AI models can get famous buildings subtly wrong. Check the Shore Temple and the Charminar carefully, or use real stock footage for those two and AI for the crowds.

### 3. A real drone operator
The most authentic option: film at the actual Shore Temple (drone flights there need permission from the Archaeological Survey of India) and at the Charminar (Hyderabad restricts drone flights and needs police permission).

## Adding the clips

```bash
mkdir -p originals/scenes           # already git-ignored
# copy the clips in as sangeeth.mp4, haldi.mp4, wedding.mp4, hyderabad.mp4
bash tools/prepare-scenes.sh
# optional trims, e.g.: HALDI_START=2 HALDI_LEN=9 bash tools/prepare-scenes.sh
git add public/media/scenes && git commit -m "Add scene footage" && git push
```

Each 8-second scene becomes about 120 frames, roughly 4–6 MB. Frames load progressively (a rough pass first, then filled in), and only for the scene being approached. The whole site must stay under 100 MB; the script prints the total.
