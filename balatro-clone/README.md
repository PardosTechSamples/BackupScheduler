# Ante Run — Balatro-style HTML clone

A fan-made browser poker roguelike inspired by **Balatro**, hosted as static HTML.

Open [`index.html`](index.html) in a browser, or serve the folder:

```bash
cd balatro-clone
python3 -m http.server 8080
# visit http://localhost:8080
```

## Rulebook-funded mechanics

Values and flow follow community wiki / published Balatro rules:

- **Score** = Chips × Mult
- Level-1 poker hand bases (High Card 5×1 through Flush Five 160×16)
- Card chip values (2–10 face, J/Q/K = 10, A = 11); only relevant cards score
- Antes 1–8 White Stake base chips; Small 1× / Big 1.5× / Boss 2× (Wall 4×, Needle 1×)
- 4 hands / 3 discards, shop with Jokers & Planet cards, interest ($1 per $5, max $5)
- Joker order left → right (+Mult before ×Mult)

## Fan note

Unofficial tribute — not affiliated with LocalThunk or Playstack. For private / educational use.
