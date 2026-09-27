# IBM 3270 interface font

`3270-Regular.woff2` is a lossless WOFF2 repack of `3270-Regular.ttf` from
[3270font v3.0.1](https://github.com/rbanffy/3270font/releases/tag/v3.0.1),
archive `3270_fonts_d916271.zip`. Glyph outlines and metrics are unchanged.
The archive's license is included as `3270-LICENSE.txt`.

The font author documents its lineage: x3270, Georgia Tech's 3270tool, and
characters hand-copied from a physical IBM 3270-series terminal. It is a modern
outline reconstruction, not an original terminal ROM or a generic coding font.

Source: https://github.com/rbanffy/3270font

Conversion with fontTools 4.x and Brotli:

```python
from fontTools.ttLib import TTFont
font = TTFont('3270-Regular.ttf')
font.flavor = 'woff2'
font.save('3270-Regular.woff2')
```

The web font is bundled with the app and cached for offline use. It is only
requested when the Terminal interface is used. All other styles retain their
existing typefaces.
