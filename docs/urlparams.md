# URL parameters

The standalone app at `https://gmod.org/JBrowseMSA/demo/` reads its launch state
from one URL parameter, `data`, and writes it back as the view changes. The
embedded React component, the R package and the Python widget take props
instead; see [Embedding](https://gmod.org/JBrowseMSA/embedding).

- **In:** a `#data=` fragment holding an `MsaView` snapshot or its shorthand
- **Out:** the app opens that view, and the address bar follows every change

## Fragment or query string

- `#data=…` is the form to write. The browser never sends a fragment to the
  server, so gmod.org's 8,192-byte request line does not limit a link.
- `?data=…` still opens, for links written before the snapshot moved into the
  fragment. The app rewrites the address bar to `#data=` after it loads.
- A link with both reads the fragment.
- No `data` parameter opens the empty app with its example cards.
- Pasting a link that differs from the open one only in its fragment reloads the
  page on the new view.

## Three spellings of the value

The value after `data=` is one of the following.

### JSON as typed

```text
https://gmod.org/JBrowseMSA/demo/#data={"type":"MsaView","msaFilehandle":{"uri":"https://example.org/kinase.aln"},"relativeTo":"SRC_HUMAN"}
```

- A fragment that starts `#data={` or `#data=%7B` is JSON to the end of the
  link.
- The app reads a `&`, a `+` or a lone `%` inside a label as typed, so a
  hand-written link needs no escaping.
- Chat clients and markdown cut a link at a quote or a space. Use the encoded
  form below for a link that travels through either.

### URL-encoded JSON

```js
const view = {
  type: 'MsaView',
  msaFilehandle: { uri: 'https://example.org/kinase.aln' },
  relativeTo: 'SRC_HUMAN',
}
const url = `https://gmod.org/JBrowseMSA/demo/#data=${encodeURIComponent(JSON.stringify(view))}`
```

### Gzipped JSON

A value that starts `z.` is the JSON gzipped and encoded as base64url. This is
the form the app writes to the address bar and the form **Copy link** produces.

```js
const stream = new Blob([JSON.stringify(view)])
  .stream()
  .pipeThrough(new CompressionStream('gzip'))
const bytes = new Uint8Array(await new Response(stream).arrayBuffer())
const url = `https://gmod.org/JBrowseMSA/demo/#data=z.${btoa(
  String.fromCharCode(...bytes),
)
  .replaceAll('+', '-')
  .replaceAll('/', '_')
  .replace(/=+$/, '')}`
```

Node writes the same value with `Buffer.from(bytes).toString('base64url')`. A
400 kB protein alignment encodes to about 305,000 characters this way.

The link below opens a two-row alignment with a highlight on residues 3 to 5 of
the human row:

<https://gmod.org/JBrowseMSA/demo/#data=z.H4sIAAAAAAAAA6tWKqksSFWyUvItTgzLTC1X0lHKLU5UslKyyyjNTcyLyfP1dnT0C3aNybPLzS8tTgUL6IIFlHSUCktTiyqVrJTAapV0lDIy0zNyMtMzSoqVrKKVjHVNFYozS1KVYmsBppVuIWcAAAA>

## What the value holds

The decoded value is one of two JSON objects.

- A bare snapshot, `{"type": "MsaView", …}`, which is what the docs and every
  other embedding write.
- The wrapper `{"msaview": {"type": "MsaView", …}}`, which the app writes back
  to the address bar.

Either object takes the shorthand that `expandSpec` expands, so a link can name
a file or give the data inline:

| Key            | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| `msa`          | a URL, or the alignment itself when it spans more than one line |
| `tree`         | a URL, or a Newick string when it starts with `(`               |
| `query`        | sets `relativeTo` and the `row` of each entry that names none   |
| `highlights`   | `"175"`, `"530-540 label"` or full highlight objects            |
| `region`       | `"100-250"` or a full region object                             |
| `columnTracks` | tracks given as `values`, `data` or `arcs`                      |

Every other key is a property of the `MsaView` model. The
[layers reference](https://gmod.org/JBrowseMSA/layers) describes the layer
fields and their shorthand, and the
[model API docs](https://github.com/GMOD/JBrowseMSA/blob/main/packages/lib/apidocs/MsaView.md)
list every property.

## What decides whether a link works

- **Relative `uri`.** The app resolves a `uri` against its own address, so
  `data/kinase.aln` means `gmod.org/JBrowseMSA/demo/data/kinase.aln`. A link you
  send needs absolute URLs.
- **CORS.** The browser fetches each `uri` from `gmod.org`, so the server
  holding the file has to send `Access-Control-Allow-Origin`. GitHub Pages, S3
  with a CORS rule and the public EBI, NCBI and PDBe APIs do.
- **Length.** The app keeps a link at 1,000,000 characters or fewer, which
  Chrome and Firefox both open. Safari is untested.
- **Inline files.** The app inlines a pasted or locally opened file up to 1 MB.
  A larger file stays in the running viewer, the header shows **Not in the
  link**, and **Copy link** turns off and says why. Serve the file over HTTP and
  open it by URL to share it.
- **A view that outgrows the limit.** The app removes `#data=` from the address
  bar, so the bar holds no URL that opens an empty viewer.

## When the value is wrong

A value the app cannot parse opens an error naming the problem, such as
`Could not open the view in this link's data= parameter: …`, and the address bar
keeps the link so you can fix it. A value that parses as JSON but is neither of
the two objects above fails with
`expected {"msaview": {"type": "MsaView", ...}} or a bare {"type": "MsaView", ...} snapshot`.

## The address bar follows the view

- One second after the last change, the app writes the whole snapshot to the
  address bar as `#data=z.…` with `history.replaceState`, so the back button
  does not step through edits.
- A view with an error leaves the address bar as it was.
- **Copy link** copies the same URL.

## Other pages

- `https://gmod.org/JBrowseMSA/examples#<slug>` selects an example. The slug is
  the example's name in lowercase with punctuation dropped and spaces turned to
  hyphens, so `#load-from-url` opens "Load from URL".
- Every figure in the [user guide](https://gmod.org/JBrowseMSA/guide) and the
  [layers reference](https://gmod.org/JBrowseMSA/layers) links to the app with a
  `#data=` value.
