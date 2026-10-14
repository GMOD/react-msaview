#!/usr/bin/env bash
# Build a kinase-domain alignment, tree and row metadata for the whole human
# kinome, and print the landmark columns, logo shares and gatekeeper tally that
# docs/tutorials/kinase_pocket.md quotes. Every step is the one shown there.
#
#   bash build_kinase_pocket.sh [outdir]
#
# Needs: curl, python3, docker (pulls quay.io/biocontainers/hmmer and
# quay.io/biocontainers/fasttree). Writes into outdir (default: .).
set -euo pipefail

OUT=${1:-.}
mkdir -p "$OUT"
HMMER_IMAGE=quay.io/biocontainers/hmmer:3.4--h7d74f8d_5
FASTTREE_IMAGE=quay.io/biocontainers/fasttree:2.2.0--h7b50bb2_1

# 1. UniProt's own classification of the human and mouse kinomes
curl -sfL https://www.uniprot.org/docs/pkinfam.txt -o "$OUT/pkinfam.txt"

# 2. keep the HUMAN entries and their group, dropping the paired MOUSE column
python3 - "$OUT" <<'EOF'
import json
import re
import sys

out = sys.argv[1]
lines = open(f'{out}/pkinfam.txt').read().splitlines()
group = None
rows = []
i, n = 0, len(lines)
while i < n:
    line = lines[i]
    if re.fullmatch(r'=+', line.strip()) and i + 2 < n and re.fullmatch(r'=+', lines[i + 2].strip()):
        group = lines[i + 1].strip()
        i += 3
        continue
    m = re.match(r'^(\S+)\s+(\S+_HUMAN)\s+\((\w+)\s*\)', line)
    if m:
        gene, entry, acc = m.groups()
        short = group.split()[0].rstrip(':')
        if group.startswith('Tyr'):
            short = 'TK'
        elif group.startswith('Atypical'):
            short = 'Atypical'
        rows.append({'gene': gene, 'accession': acc, 'group': short})
    i += 1
json.dump(rows, open(f'{out}/kinases.json', 'w'), indent=1)
print(f'{len(rows)} human kinase entries')
EOF

# 3. one UniProt sequence per accession, 50 per request through the /stream
#    endpoint rather than one request per protein
python3 - "$OUT" <<'EOF'
import json
import sys
import time
import urllib.parse
import urllib.request

out = sys.argv[1]
kinases = json.load(open(f'{out}/kinases.json'))
accs = [k['accession'] for k in kinases]
batch = 50
with open(f'{out}/all.fasta', 'w') as fh:
    for i in range(0, len(accs), batch):
        chunk = accs[i:i + batch]
        query = ' OR '.join(f'accession:{a}' for a in chunk)
        url = 'https://rest.uniprot.org/uniprotkb/stream?query=' + urllib.parse.quote(query) + '&format=fasta'
        for attempt in range(3):
            try:
                with urllib.request.urlopen(url, timeout=60) as resp:
                    fh.write(resp.read().decode())
                break
            except Exception:
                time.sleep(2)
        else:
            raise SystemExit(f'failed to fetch batch at {i}')
print('fetched', len(accs), 'sequences')
EOF

# 4. the Pfam Pkinase HMM (PF00069), gzip-compressed over HTTP
curl -sf "https://www.ebi.ac.uk/interpro/api/entry/pfam/PF00069/?annotation=hmm" |
  gzip -dc > "$OUT/pf00069.hmm"

# 5. score every candidate against the HMM; keep only entries that clear
#    Pfam's own gathering threshold, which is how the atypical, non-ePK-fold
#    kinases (PI3/PI4-kinase, ADCK, alpha-type...) drop out
docker run --rm -v "$OUT:/work" -w /work "$HMMER_IMAGE" \
  hmmsearch --cut_ga --tblout hmmsearch.tbl -o hmmsearch.out pf00069.hmm all.fasta

python3 - "$OUT" <<'EOF'
import json
import sys

out = sys.argv[1]
passing = set()
for line in open(f'{out}/hmmsearch.tbl'):
    if line.startswith('#'):
        continue
    passing.add(line.split('|')[1])

kinases = json.load(open(f'{out}/kinases.json'))
seqs, name, buf = {}, None, []
for line in open(f'{out}/all.fasta'):
    line = line.rstrip('\n')
    if line.startswith('>'):
        if name is not None:
            seqs[name] = ''.join(buf)
        name, buf = line.split('|')[1], []
    else:
        buf.append(line)
if name is not None:
    seqs[name] = ''.join(buf)

kept = [k for k in kinases if k['accession'] in passing]
json.dump(kept, open(f'{out}/kept.json', 'w'), indent=1)
with open(f'{out}/kept.fasta', 'w') as fh:
    for k in kept:
        fh.write(f">{k['gene']}\n{seqs[k['accession']]}\n")
print(f'{len(kept)} of {len(kinases)} entries clear the Pkinase gathering threshold')
dropped = [k for k in kinases if k['accession'] not in passing]
atypical = sum(k['group'] == 'Atypical' for k in dropped)
print(f'{len(dropped)} do not clear it, {atypical} of them Atypical')
EOF

# 6. align the kinase domain to the HMM and keep only its match columns
#    (--trim drops unaligned terminal tails; stripping the lowercase/'.'
#    insert-state characters that remain collapses the alignment to a fixed
#    262 columns, the HMM's own length)
docker run --rm -v "$OUT:/work" -w /work "$HMMER_IMAGE" \
  hmmalign --trim --outformat afa -o kinase.afa pf00069.hmm kept.fasta

python3 - "$OUT" <<'EOF'
import sys

out = sys.argv[1]
seqs, name, buf = {}, None, []
for line in open(f'{out}/kinase.afa'):
    line = line.rstrip('\n')
    if line.startswith('>'):
        if name is not None:
            seqs[name] = ''.join(buf)
        name, buf = line[1:].strip(), []
    else:
        buf.append(line)
if name is not None:
    seqs[name] = ''.join(buf)

lengths = set()
with open(f'{out}/kinase-pocket.afa', 'w') as fh:
    for name, seq in seqs.items():
        kept = ''.join(c for c in seq if c.isupper() or c == '-')
        lengths.add(len(kept))
        fh.write(f'>{name}\n{kept}\n')
print('alignment width after trimming inserts:', lengths)
EOF

# 7. FastTree from the trimmed alignment, since the viewer's built-in
#    neighbor joining is capped at 500 rows (see the page)
docker run --rm -v "$OUT:/work" -w /work "$FASTTREE_IMAGE" \
  FastTree kinase-pocket.afa > "$OUT/kinase-pocket.nwk" 2> "$OUT/fasttree.log"
tail -1 "$OUT/fasttree.log"

# 8. row metadata: each gene's kinase group and accession, read by the
#    viewer's node-info dialog on click
python3 - "$OUT" <<'EOF'
import json
import sys

out = sys.argv[1]
kept = json.load(open(f'{out}/kept.json'))
meta = {k['gene']: {'group': k['group'], 'uniprot': k['accession']} for k in kept}
json.dump(meta, open(f'{out}/kinase-pocket-metadata.json', 'w'), indent=1)
EOF


# 9. the numbers the page quotes: ABL1's landmark columns, each landmark
#    column's residue shares over all rows, and the gatekeeper tally. Reads only
#    the three files written above, plus all.fasta for ABL1's full sequence
python3 - "$OUT" <<'PY'
import json
import sys
from collections import Counter

out = sys.argv[1]


def read_fasta(path, key):
    seqs, name = {}, None
    for line in open(path):
        line = line.rstrip('\n')
        if line.startswith('>'):
            name = key(line[1:])
            seqs[name] = ''
        else:
            seqs[name] += line
    return seqs


alignment = read_fasta(f'{out}/kinase-pocket.afa', str.strip)
metadata = json.load(open(f'{out}/kinase-pocket-metadata.json'))
uniprot_sequence = read_fasta(f'{out}/all.fasta', lambda h: h.split('|')[1])

full_abl1 = uniprot_sequence[metadata['ABL1']['uniprot']]
aligned_abl1 = alignment['ABL1']
residues = [(col, c) for col, c in enumerate(aligned_abl1, 1) if c != '-']
pos = full_abl1.find(''.join(c for _, c in residues[:8]))
abl1_number = {}
for col, c in residues:
    pos = full_abl1.index(c, pos)
    abl1_number[col] = pos + 1
    pos += 1
print(f'ABL1: {len(full_abl1)} aa, {len(aligned_abl1)} alignment columns')
for label, cols in [('catalytic K', [30]), ('gatekeeper', [77]), ('DFG', [141, 142, 143])]:
    span = f'{cols[0]}' if len(cols) == 1 else f'{cols[0]}-{cols[-1]}'
    print(f'{label}: column {span}, ABL1 ' + ' '.join(f'{aligned_abl1[c - 1]}{abl1_number[c]}' for c in cols))

total = len(alignment)


def tally(col, top):
    counts = Counter(row[col - 1] for row in alignment.values())
    return ', '.join(f'{r} {n} ({100 * n / total:.1f}%)' for r, n in counts.most_common(top))


print(f'catalytic K, column 30 over {total} rows: {tally(30, 3)}')
print(f'control, column 102: {tally(102, 8)}')
print('gatekeeper, column 77:')
for r, n in Counter(row[76] for row in alignment.values()).most_common(5):
    print(f'{r}  {n:3d}  {100 * n / total:.1f}%')
for family in [['ABL1', 'ABL2', 'KIT', 'PDGFRA', 'CSF1R', 'LCK'], ['MATK', 'CSK'], ['CDK1', 'CDK2', 'CDK3', 'CDK16', 'CDK17']]:
    print(' '.join(f'{g}={alignment[g][76]}' for g in family))
PY

# 10. KLIFS's own 85-residue pocket alignment, queried live, for the same
#     position (pocket residue 45) over its human kinases
python3 - <<'PY'
import json
import urllib.request
from collections import Counter

url = 'https://klifs.net/api/kinase_information?species=Human'
entries = json.load(urllib.request.urlopen(url, timeout=60))
pockets = [e['pocket'] for e in entries if isinstance(e['pocket'], str) and len(e['pocket']) == 85]
threonine = sum(p[44] == 'T' for p in pockets)
print(f'KLIFS: {threonine} of {len(pockets)} human pockets read T at residue 45 ({100 * threonine / len(pockets):.1f}%)')
PY

echo
echo "wrote $OUT/kinase-pocket.afa, $OUT/kinase-pocket.nwk, $OUT/kinase-pocket-metadata.json"
