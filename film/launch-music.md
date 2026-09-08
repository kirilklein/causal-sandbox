# Launch soundtrack

The user-selected [LinkedIn export](exports/causal-sandbox-linkedin.mp4) is
tracked in Git, preserved exactly as supplied (20 seconds, 1080p, 60 fps). This supplied file contains no embedded audio stream. The brief
and mixing command below describe how to produce a version with audio.

In Adobe Firefly, choose **Audio → Generate music** and upload
`exports/causal-sandbox-social-silent.mp4`. Keep the detected 20-second duration,
set **Energy: Low** and **Tempo: Slow**, and replace the suggested prompt with:

> Minimalist solo felt piano for a scientific animation about two possible
> futures. Warm, quietly curious and gently hopeful. Sparse original melody,
> soft hammer attacks, open chords, delicate answering phrases and restrained
> room reverb. A flowing, unhurried pulse that gradually becomes more spacious,
> with a gentle resolved ending and a natural final decay. Understated background
> accompaniment with room to read. No vocals, percussion, ticking, bright bells,
> dramatic swells or abrupt ending.

If Firefly presents separate tags, use **Vibe:** warm, curious, gently hopeful;
**Style:** minimalist solo felt piano; **Purpose:** subtle scientific explainer
background. Preview its variations against the video. Choose one that resolves
before the final hold, with space for the last chord to decay.

Firefly can download the video with music attached. Keep that social export
separate from the silent website master. If exporting audio separately, use the
quiet mix below. Prompt adjectives alone do not set the final playback volume.

[Adobe's video-to-music workflow](https://helpx.adobe.com/firefly/web/work-with-audio-and-video/work-with-audio/generate-music-for-videos.html).

Place the chosen 20-second audio at `film/exports/launch-music.wav`. With ffmpeg
installed, create the separate LinkedIn version from the silent master:

```sh
ffmpeg -y -i film/exports/causal-sandbox-social-silent.mp4 \
  -i film/exports/launch-music.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy \
  -af "loudnorm=I=-25:TP=-9:LRA=7,afade=t=in:d=0.25,afade=t=out:st=18:d=2,apad" \
  -t 20 -c:a aac -b:a 192k -ar 48000 -movflags +faststart \
  film/exports/causal-sandbox-linkedin.mp4
```

The quiet mix is a starting point; audition on phone speakers and headphones.
Raw soundtrack files and intermediate exports stay ignored in `film/exports/`;
the selected `causal-sandbox-linkedin.mp4` is tracked. The mixing command above
replaces that selected export, so run it only when updating the final asset.
