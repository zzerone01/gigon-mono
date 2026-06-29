# Social assets — Facebook

Built from the GigOn brand system (power-mark + `Gig`/`On` wordmark, Royal/Amber
palette, Poppins/Inter). Sources live alongside the exports so they can be
regenerated.

| File | Size | Use |
| --- | --- | --- |
| `facebook-profile.png` | 1080×1080 | **Profile picture.** White power-mark on a Royal radial. Centred so Facebook's circular crop never clips the glyph. |
| `facebook-cover.png` | 1640×624 | **Cover / background photo.** Centre-composed lockup + tagline so it survives Facebook's mobile centre-crop; amber `₱` price pins frame the sides as a nod to the product map. |

## Notes

- The cover keeps all text inside the centre ~60% (Facebook's mobile-safe zone).
  The side price-pins are decorative and may be cropped on mobile — by design.
- Facebook recommends a cover of 851×315; 1640×624 (same 2.63:1 ratio) is
  supplied for a crisp upload. Profile pics upload best at ≥320×320; 1080² is
  used for retina sharpness.

## Regenerate

Sources: `profile.html`, `cover.html` (rendered with headless Chrome, then
downscaled 2× with ImageMagick). From the session scratchpad:

```sh
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=2 \
  --window-size=1080,1080 --virtual-time-budget=6000 \
  --screenshot=profile@2x.png file://$PWD/profile.html
"$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=2 \
  --window-size=1640,624 --virtual-time-budget=9000 \
  --screenshot=cover@2x.png file://$PWD/cover.html
magick profile@2x.png -filter Lanczos -resize 1080x1080 facebook-profile.png
magick cover@2x.png   -filter Lanczos -resize 1640x624  facebook-cover.png
```
