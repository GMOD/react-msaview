#!/usr/bin/env python3
"""Build every file docs/tutorials/phylogeny_at_scale.md loads.

Fetch Nextstrain's RSV-A build, reconstruct each tip's genome from the
mutations on its root-to-tip path, and write:

- rsv-full.aln, rsv-full.nh: all 1,840 tips, the alignment sliced to the G gene
- rsv-sample.aln, rsv-sample.nh: every 10th tip, whole genome
- rsv-sample-rowdata.json: the subsample's clade, country, region and year,
  keyed by row name

Print every number the tutorial quotes.

  python3 build_phylogeny_at_scale.py [outdir]

Needs: python3, standard library only.
"""

import collections
import gzip
import json
import os
import re
import sys
import urllib.request

URL = "https://data.nextstrain.org/rsv_a_genome.json"
STEP = 10

out = sys.argv[1] if len(sys.argv) > 1 else "."
os.makedirs(out, exist_ok=True)


def fetch_json(url):
    print(f"fetching {url}")
    request = urllib.request.Request(url, headers={"Accept-Encoding": "gzip"})
    with urllib.request.urlopen(request) as res:
        body = res.read()
    return json.loads(gzip.decompress(body) if body[:2] == b"\x1f\x8b" else body)


build = fetch_json(URL)
tree = build["tree"]
root_seq = build["root_sequence"]["nuc"]
ann = build["meta"]["genome_annotations"]
G_START, G_END = ann["G"]["start"], ann["G"]["end"]
L_START, L_END = ann["L"]["start"], ann["L"]["end"]


def label_for(node_attrs, name):
    accession = re.sub(r"\s+", "_", name)
    clade = node_attrs.get("clade_membership", {}).get("value", "NA")
    country = node_attrs.get("country", {}).get("value", "NA").replace(" ", "_")
    num_date = node_attrs.get("num_date", {}).get("value")
    year = str(int(num_date)) if num_date is not None else "NA"
    return f"{accession}|{clade}|{country}|{year}"


def fields_for(node_attrs):
    num_date = node_attrs.get("num_date", {}).get("value")
    return {
        "clade": node_attrs.get("clade_membership", {}).get("value", "NA"),
        "country": node_attrs.get("country", {}).get("value", "NA"),
        "region": node_attrs.get("region", {}).get("value", "NA"),
        "year": str(int(num_date)) if num_date is not None else "NA",
    }


# 1. Reconstruct every tip's genome. Nextstrain numbers every mutation against
# the one root sequence, so the rows come out the same length and aligned.
MUT_RE = re.compile(r"^([A-Za-z-])(\d+)([A-Za-z-])$")
tips = []


def reconstruct(node, seq):
    muts = node.get("branch_attrs", {}).get("mutations", {}).get("nuc", [])
    if muts:
        seq = bytearray(seq)
        for m in muts:
            _ref, pos, alt = MUT_RE.match(m).groups()
            seq[int(pos) - 1] = ord(alt)
        seq = bytes(seq)
    na = node.get("node_attrs", {})
    if not node.get("children"):
        tips.append((label_for(na, node["name"]), seq, na))
    else:
        for child in node["children"]:
            reconstruct(child, seq)


reconstruct(tree, root_seq.encode())
print(f"reconstructed {len(tips)} tip sequences, genome length {len(root_seq)}")
print(f"G gene {G_START}-{G_END} ({G_END - G_START + 1} nt)")
print(f"L gene {L_START}-{L_END} ({L_END - L_START + 1} nt)")


# A plain {name, div, children} tree, optionally pruned to the tips in `keep`.
# Pruning splices out a node left with one child; `div` is cumulative from the
# root, so a branch length is a node's div minus its parent's either way.
def as_tree(node, keep=None):
    na = node.get("node_attrs", {})
    div = na.get("div", 0)
    kids = node.get("children")
    if not kids:
        label = label_for(na, node["name"])
        if keep is not None and label not in keep:
            return None
        return {"name": label, "div": div, "children": []}
    children = [c for c in (as_tree(k, keep) for k in kids) if c is not None]
    if not children:
        return None
    if keep is not None and len(children) == 1:
        return children[0]
    return {"name": "", "div": div, "children": children}


def set_lengths(node, parent_div=0):
    node["length"] = float(f"{max(node['div'] - parent_div, 0):.5f}")
    for c in node["children"]:
        set_lengths(c, node["div"])


def newick(node):
    inner = (
        f"({','.join(newick(c) for c in node['children'])})"
        if node["children"]
        else node["name"]
    )
    return f"{inner}:{node['length']:.5f}"


def write_dataset(stem, rows, root):
    set_lengths(root)
    with open(f"{out}/{stem}.aln", "w") as fh:
        for label, seq in rows:
            fh.write(f">{label}\n{seq.decode()}\n")
    with open(f"{out}/{stem}.nh", "w") as fh:
        fh.write(newick(root) + ";\n")


# 2. Every tip, sliced to the G gene: the whole genome at this row count would
# be about 28 MB.
write_dataset(
    "rsv-full",
    [(label, seq[G_START - 1 : G_END]) for label, seq, _na in tips],
    as_tree(tree),
)
print(f"wrote {out}/rsv-full.aln and {out}/rsv-full.nh ({len(tips)} tips)")


# 3. A clade to collapse, every tip of it one clade call and one country. The
# ids follow generateNodeIds in msa-parsers/src/util.ts, which numbers children
# in the order the Newick above keeps.
def tips_under(node, this_id, depth, found):
    kids = node.get("children")
    if not kids:
        na = node.get("node_attrs", {})
        calls = [
            (
                na.get("clade_membership", {}).get("value", "NA"),
                na.get("country", {}).get("value", "NA"),
            )
        ]
    else:
        calls = []
        for i, k in enumerate(kids):
            calls += tips_under(k, f"{this_id}-{i}-{depth + 1}", depth + 1, found)
    found[this_id] = calls
    return calls


calls_by_id = {}
tips_under(tree, "node-0", 0, calls_by_id)
target = max(
    (
        (len(calls), nid, calls[0])
        for nid, calls in calls_by_id.items()
        if 20 <= len(calls) <= 60 and len(set(calls)) == 1
    ),
    key=lambda t: t[0],
)
print(
    f"collapse target: {target[1]}, {target[0]} tips, "
    f"clade {target[2][0]}, all {target[2][1]}"
)

# 4. Every 10th tip in the file's order, whole genome.
sample = [t for i, t in enumerate(tips) if i % STEP == 0]
sample_labels = {label for label, _seq, _na in sample}
print(f"subsample: {len(sample)} of {len(tips)} tips (every {STEP}th)")
root = as_tree(tree, sample_labels)
write_dataset("rsv-sample", [(label, seq) for label, seq, _na in sample], root)
print(
    f"wrote {out}/rsv-sample.aln and {out}/rsv-sample.nh "
    f"({len(sample)} tips, {len(root_seq)} nt)"
)
all_clades = {label.split("|")[1] for label, _seq, _na in tips}
sample_clades = collections.Counter(label.split("|")[1] for label in sample_labels)
print(f"{len(sample_clades)} of {len(all_clades)} clades represented in the subsample")


# 5. Columns holding more than one base, ignoring N, per gene and over the two
# 100-column windows the base-resolution figures show.
def variable_columns(seqs, start1, end1):
    count = 0
    for col in range(start1 - 1, end1):
        alleles = {s[col] for s in seqs} - {ord("N")}
        count += len(alleles) > 1
    return count


sample_seqs = [seq for _label, seq, _na in sample]
for name, start, end in (("G gene", G_START, G_END), ("L gene", L_START, L_END)):
    n = variable_columns(sample_seqs, start, end)
    length = end - start + 1
    print(f"{name}: {n}/{length} variable columns ({100 * n / length:.1f}%)")
for name, start, end in (("G hotspot", 5442, 5541), ("L coldspot", 10132, 10231)):
    n = variable_columns(sample_seqs, start, end)
    print(f"{name} ({start}-{end}): {n}/100 variable columns")

# 6. The row table: four node_attrs fields per subsampled tip, keyed by the
# row name the alignment and the tree carry.
table = {label: fields_for(na) for label, _seq, na in sample}
path = f"{out}/rsv-sample-rowdata.json"
with open(path, "w") as fh:
    json.dump(table, fh, indent=0, sort_keys=True)
    fh.write("\n")
print(f"wrote {path}: {len(table)} rows, {os.path.getsize(path) / 1024:.0f} kB")
for field in ("clade", "country", "region", "year"):
    values = {fields[field] for fields in table.values()}
    print(f"  {field}: {len(values)} distinct values")
for clade, n in collections.Counter(
    fields["clade"] for fields in table.values()
).most_common(6):
    print(f"  clade {clade}: {n} rows")


def nodes_of(node):
    yield node
    for c in node["children"]:
        yield from nodes_of(c)


def leaves_of(node):
    if not node["children"]:
        yield node
    else:
        for c in node["children"]:
            yield from leaves_of(c)


all_nodes = list(nodes_of(root))
internal = [n for n in all_nodes if n["children"]]
print(f"pruned tree: {len(all_nodes) - len(internal)} tips, {len(all_nodes) - 1} edges")


# 7. The branch channel gives a node the field value its tips agree on and
# draws the edge above it in that value's color.
def shared_values(field):
    value = {}
    for node in reversed(all_nodes):
        if node["children"]:
            seen = {value[id(c)] for c in node["children"]}
            value[id(node)] = seen.pop() if len(seen) == 1 else None
        else:
            value[id(node)] = table[node["name"]][field]
    return value


for field in ("clade", "country", "region"):
    value = shared_values(field)
    colored = sum(1 for n in all_nodes[1:] if value[id(n)] is not None)
    colored_internal = sum(1 for n in internal[1:] if value[id(n)] is not None)
    print(
        f"branch by {field}: {colored}/{len(all_nodes) - 1} edges colored, "
        f"{colored_internal}/{len(internal) - 1} of them above an internal node"
    )

# 8. The largest clade whose tips are exactly the tips under one node, and two
# tips under different children of that node, which address it whatever its
# size.
members = collections.defaultdict(set)
for name, fields in table.items():
    members[fields["clade"]].add(name)

mrca_of = {}
for node in all_nodes:
    covered = {t["name"] for t in leaves_of(node)}
    for clade, names in members.items():
        if names <= covered:
            prev = mrca_of.get(clade)
            if prev is None or len(covered) < len(prev[1]):
                mrca_of[clade] = (node, covered)

monophyletic = {
    clade: node
    for clade, (node, covered) in mrca_of.items()
    if covered == members[clade]
}
print(f"{len(monophyletic)} of the {len(members)} clades are one node's tips")
best_clade = max(monophyletic, key=lambda c: len(members[c]))
best = monophyletic[best_clade]
best_tips = [t["name"] for t in leaves_of(best)]
first = next(leaves_of(best["children"][0]))["name"]
last = next(leaves_of(best["children"][-1]))["name"]
print(f"largest of them: {best_clade}, {len(best_tips)} tips")
print(f"  mrca tips: {first} and {last}")


# 9. Display rows: the viewer sorts each node's children by branch length,
# shortest first, so the row a tip draws on is not its line in the file.
def display_rows(node):
    if not node["children"]:
        return [node["name"]]
    rows = []
    for c in sorted(node["children"], key=lambda c: c["length"]):
        rows += display_rows(c)
    return rows


order = display_rows(root)
row_of = {name: i for i, name in enumerate(order)}
runs = []
for i, name in enumerate(order):
    clade = table[name]["clade"]
    if runs and runs[-1][0] == clade:
        runs[-1][2] += 1
    else:
        runs.append([clade, i, 1])
for clade, start, n in runs:
    if n >= 8:
        print(f"display rows {start}-{start + n - 1}: {clade}")
rows = [row_of[name] for name in best_tips]
print(f"{best_clade} spans display rows {min(rows)}-{max(rows)}")

# 10. One tip, its raw node_attrs and the record the table gives it.
label, _seq, na = next(t for t in sample if t[0].startswith("RSVA/20200035"))
raw = {k: na[k] for k in ("clade_membership", "country", "region", "num_date") if k in na}
print(f"check tip: {label}, display row {row_of[label]}")
print(f"  node_attrs: {json.dumps(raw)}")
print(f"  row: {json.dumps(table[label])}")
