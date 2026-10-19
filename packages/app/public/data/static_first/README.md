# NLRP1 static-first pages

The files [`docs/tutorials/static_first.md`](../../../../../docs/tutorials/static_first.md)
links, served at `gmod.org/JBrowseMSA/demo/data/static_first/*`. All of them
come out of one run of `docs/tutorials/scripts/build_static_first.sh`, which
reads the NLRP1 alignment, tree and domains one folder up. Regenerate with:

```sh
bash docs/tutorials/scripts/build_static_first.sh /tmp/static_first
cp /tmp/static_first/{nlrp1.json,nlrp1.svg,index.html,live.html} packages/app/public/data/static_first/
```

| File         | Format | Provenance                                                                                            |
| ------------ | ------ | ----------------------------------------------------------------------------------------------------- |
| `nlrp1.json` | JSON   | `MSAViewer` props naming `nlrp1.aln`, `nlrp1.nh` and `nlrp1-domains.gff` by URL, step 1 of the page   |
| `nlrp1.svg`  | SVG    | `react-msaview-cli export-svg --props nlrp1.json --viewport --width 900`, step 2                      |
| `index.html` | HTML   | The page that shows `nlrp1.svg` and mounts the viewer from `nlrp1.json` on a click, steps 3 and 4     |
| `live.html`  | HTML   | The same page with the viewer mounted on load, which step 6 measures against `index.html`             |
