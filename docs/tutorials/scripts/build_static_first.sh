#!/usr/bin/env bash
# Build the pages of docs/tutorials/static_first.md: one props file for the
# NLRP1 family of docs/tutorials/protein_family.md, the SVG the CLI draws from
# it, a page that shows the SVG and loads the viewer on a click, a page that
# loads the viewer at once, and a Lighthouse run over each.
#
#   bash build_static_first.sh [outdir]
#
# Needs: node 18 or later (npx fetches react-msaview-cli, serve and lighthouse),
# gzip, and Chrome or Chromium for Lighthouse. Writes into outdir (default: .)
# and prints every number the page quotes.
set -euo pipefail

OUT=${1:-.}
mkdir -p "$OUT"
DATA=https://gmod.org/JBrowseMSA/demo/data
BUNDLE=https://unpkg.com/react-msaview@9.1.1/bundle/index.js

# 1. the props both the CLI and the page's viewer read
cat > "$OUT/nlrp1.json" <<JSON
{
  "msaUrl": "$DATA/nlrp1.aln",
  "treeUrl": "$DATA/nlrp1.nh",
  "gffUrl": "$DATA/nlrp1-domains.gff",
  "height": 360,
  "hideHeader": true
}
JSON

# 2. the first frame of that viewer, drawn by the CLI with no browser
npx --yes react-msaview-cli@9.1.1 export-svg --props "$OUT/nlrp1.json" \
  --viewport --width 900 -o "$OUT/nlrp1.svg"

# 3. the page that shows the SVG and loads the viewer on a click
cat > "$OUT/index.html" <<HTML
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>NLRP1, static first</title>
    <style>
      .msa-embed {
        position: relative;
        max-width: 900px;
        height: 365px;
      }
      .msa-embed > img {
        display: block;
        max-width: 100%;
        max-height: 100%;
      }
      .msa-explore {
        position: absolute;
        right: 8px;
        bottom: 8px;
      }
    </style>
  </head>
  <body>
    <h1>The NLRP1 family</h1>
    <div class="msa-embed" data-props="nlrp1.json">
      <img
        src="nlrp1.svg"
        alt="Twelve NLRP1 orthologs aligned under their tree, with the PAAD/DAPIN/Pyrin domain filled green"
      />
      <button type="button" class="msa-explore">Explore the alignment</button>
    </div>
    <p>Twelve mammalian and fish orthologs, with their InterPro domains.</p>
    <script>
      const bundle = '$BUNDLE'
      let bundleLoaded

      function loadBundle() {
        bundleLoaded ??= new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = bundle
          script.onload = resolve
          script.onerror = () => {
            script.remove()
            bundleLoaded = undefined
            reject(new Error('the viewer bundle did not load'))
          }
          document.head.append(script)
        })
        return bundleLoaded
      }

      async function explore(box) {
        const button = box.querySelector('.msa-explore')
        button.disabled = true
        button.textContent = 'Loading…'
        try {
          const [props] = await Promise.all([
            fetch(box.dataset.props).then(res => res.json()),
            loadBundle(),
          ])
          box.replaceChildren()
          window.ReactMSAView.mount(box, props)
        } catch {
          button.disabled = false
          button.textContent = 'Explore the alignment (retry)'
        }
      }

      for (const box of document.querySelectorAll('.msa-embed')) {
        box.querySelector('.msa-explore').addEventListener('click', () => {
          explore(box)
        })
      }
    </script>
  </body>
</html>
HTML

# 4. the same page with the viewer loaded at once, to measure against
cat > "$OUT/live.html" <<HTML
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>NLRP1, live</title>
    <script defer src="$BUNDLE"></script>
    <style>
      .msa-embed {
        max-width: 900px;
        height: 365px;
      }
    </style>
  </head>
  <body>
    <h1>The NLRP1 family</h1>
    <div class="msa-embed" data-props="nlrp1.json"></div>
    <p>Twelve mammalian and fish orthologs, with their InterPro domains.</p>
    <script>
      window.addEventListener('DOMContentLoaded', async () => {
        const box = document.querySelector('.msa-embed')
        const props = await fetch(box.dataset.props).then(res => res.json())
        window.ReactMSAView.mount(box, props)
      })
    </script>
  </body>
</html>
HTML

echo "nlrp1.svg: $(head -c 200 "$OUT/nlrp1.svg" | grep -o 'width="[0-9]*" height="[0-9]*"'), $(wc -c < "$OUT/nlrp1.svg") bytes, $(gzip -9c "$OUT/nlrp1.svg" | wc -c) gzipped"
echo "viewer bundle: $(curl -sf "$BUNDLE" | wc -c) bytes, $(curl -sf "$BUNDLE" | gzip -9c | wc -c) gzipped"

# 5. both pages under Lighthouse's default mobile profile, a mid-range phone on
#    a slow 4G connection, served gzipped by serve
# npx starts serve as a grandchild, so the server gets a process group of its
# own and the trap stops the whole group
set -m
npx --yes serve@14.2.6 -l 8123 "$OUT" > /dev/null 2>&1 &
SERVER=$!
set +m
trap 'kill -- -$SERVER' EXIT
for _ in $(seq 60); do
  curl -sf -o /dev/null http://localhost:8123/ && break
  sleep 1
done
for page in index live; do
  url=http://localhost:8123/$page
  [ "$page" = index ] && url=http://localhost:8123/
  npx --yes lighthouse@13.5.0 "$url" --only-categories=performance \
    --output=json --output-path="$OUT/$page.lighthouse.json" \
    --throttling-method=devtools --chrome-flags=--headless=new --quiet
done

node - "$OUT" <<'JS'
const fs = require('node:fs')
const out = process.argv[2]
for (const page of ['index', 'live']) {
  const { audits } = JSON.parse(
    fs.readFileSync(`${out}/${page}.lighthouse.json`, 'utf8'),
  )
  const ms = id => `${Math.round(audits[id].numericValue)} ms`
  const node = audits['lcp-breakdown-insight'].details.items.find(
    item => item.type === 'node',
  )
  const lcp = `${node.selector}, ${node.boundingRect.width} px wide`
  console.log(
    `${page}.html: first paint ${ms('first-contentful-paint')}, largest paint ${ms('largest-contentful-paint')} (${lcp}), speed index ${ms('speed-index')}, blocking ${ms('total-blocking-time')}, layout shift ${audits['cumulative-layout-shift'].numericValue.toFixed(3)}, ${Math.round(audits['total-byte-weight'].numericValue / 1024)} KB`,
  )
}
JS
