// Every page the tutorial index cards and the docs sidebar lists, grouped by
// `category` in the order of `tutorialCategories`. Most are
// docs/tutorials/*.md walkthroughs: the markdown is the page, and this list
// holds the card text, the sidebar label and the browser title, which markdown
// has no field for. Adding a tutorial means a file there plus an entry here.
//
// Two entries are hand-written pages under pages/tutorials instead:
// structure_link, which mounts a live alignment beside a Mol* structure, and
// jbrowse_integration, whose content is generated session URLs. [slug].astro
// builds only the slugs the markdown glob produces, so neither collides.
//
// The index is also the site's gallery, so each entry names a `thumb`: one of
// the figures that page already shows, which Astro crops to the card's 5:3 and
// re-encodes as a webp at build time. Pointing at the page's own figure keeps a
// card from drifting from it, and adds no file to docs/media.
// `thumbPosition` is what the crop keeps. A wide figure loses width, and 'left'
// holds the tree and row labels; a tall one loses height, and 'center' skips the
// toolbar and the pale first rows for the body of the alignment.

import plddtThumb from '../../../docs/media/alphafold_confidence-8.png'
import codonThumb from '../../../docs/media/codon-spry-patch.png'
import fluThumb from '../../../docs/media/flu-drift-siteb.png'
import neighborhoodThumb from '../../../docs/media/gene_neighborhoods-3.png'
import jbrowseThumb from '../../../docs/media/genome-browser-tp53-protein3d.png'
import h5n1Thumb from '../../../docs/media/influenza_surveillance_figure-overview.png'
import kinaseThumb from '../../../docs/media/kinase-pocket-family.png'
import mitoThumb from '../../../docs/media/mitogenome_genes-4.png'
import norovirusThumb from '../../../docs/media/norovirus_recombination-4.png'
import p53Thumb from '../../../docs/media/p53-variant-three-tracks.png'
import metadataThumb from '../../../docs/media/phylogeny_metadata-tip-labels.png'
import proteinThumb from '../../../docs/media/protein-family-domains.png'
import complexThumb from '../../../docs/media/protein_complex-4.png'
import proteaseThumb from '../../../docs/media/r-protease-triad.png'
import recombinantThumb from '../../../docs/media/recombination_breakpoint-2.png'
import rnaThumb from '../../../docs/media/rna-family-overview.png'
import spikeThumb from '../../../docs/media/spike-structure-final.png'
import structureLinkThumb from '../../../docs/media/structure_link-spike.png'
import temThumb from '../../../docs/media/tem_alleles-strips.png'

import type { ImageMetadata } from 'astro'

export const tutorialCategories = [
  'Families and domains',
  'Per-residue evidence',
  'Structures',
  'Phylogenies and metadata',
  'Genomes and recombination',
  'R, Python and JBrowse',
] as const

export interface Tutorial {
  /** basename of the file in docs/tutorials, without .md */
  slug: string
  category: (typeof tutorialCategories)[number]
  /** short label for the docs sidebar */
  navLabel: string
  title: string
  blurb: string
  thumb: ImageMetadata
  thumbAlt: string
  thumbPosition: 'left' | 'center'
}

export const tutorials: Tutorial[] = [
  {
    slug: 'protein_family',
    category: 'Families and domains',
    navLabel: 'Protein family',
    title: 'A protein family from a list of accessions',
    blurb:
      'Twelve UniProt accessions to an alignment, a tree and Pfam domains, in four commands outside the viewer.',
    thumb: proteinThumb,
    thumbAlt:
      'Twelve NLRP1 orthologs with their Pfam domains as colored blocks, the pyrin domain present in only five rows',
    thumbPosition: 'left',
  },
  {
    slug: 'rna_family',
    category: 'Families and domains',
    navLabel: 'RNA family',
    title: 'An RNA family, from a model and six genomes',
    blurb:
      'Search six bacterial genomes with an Rfam covariance model, align the 37 hits, and read the consensus structure off the result.',
    thumb: rnaThumb,
    thumbAlt:
      '37 SAM riboswitch hits aligned under a consensus secondary structure, with base-pair arcs spanning the helices',
    thumbPosition: 'left',
  },
  {
    slug: 'kinase_pocket',
    category: 'Families and domains',
    navLabel: 'Kinase pocket',
    title: 'Reading cross-reactivity off the kinase pocket',
    blurb:
      '474 human kinase domains, comparing the ATP-pocket residues of the kinases imatinib inhibits with those it does not.',
    thumb: kinaseThumb,
    thumbAlt:
      '474 human kinase domains as one alignment beside their tree, the conserved catalytic columns standing out as solid stripes',
    thumbPosition: 'center',
  },
  {
    slug: 'p53_variant_effects',
    category: 'Per-residue evidence',
    navLabel: 'p53 variant effects',
    title: "Where p53's damaging variants fall",
    blurb:
      'ClinVar, AlphaMissense and a saturation screen, each a bar per residue over the same fifteen-species p53 alignment.',
    thumb: p53Thumb,
    thumbAlt:
      'ClinVar, AlphaMissense and MaveDB bar tracks over a p53 ortholog alignment, all three peaking on the DNA-binding domain',
    thumbPosition: 'left',
  },
  {
    slug: 'alphafold_confidence',
    category: 'Per-residue evidence',
    navLabel: 'AlphaFold confidence',
    title: 'AlphaFold confidence across a protein family',
    blurb:
      'Fourteen vertebrate TDP-43 orthologs, each with the per-residue pLDDT of its own AlphaFold model.',
    thumb: plddtThumb,
    thumbAlt:
      "Fourteen TDP-43 rows with a mean pLDDT bar track above and each row's low-confidence runs drawn in orange over its C-terminal half",
    thumbPosition: 'left',
  },
  {
    slug: 'codon_selection',
    category: 'Per-residue evidence',
    navLabel: 'TRIM5 codon selection',
    title: 'TRIM5 and the primate antiviral arms race',
    blurb:
      '32 TRIM5 orthologs to a codon alignment, a tree, an exon structure and a per-codon dN/dS track from HyPhy.',
    thumb: codonThumb,
    thumbAlt:
      '32 primate TRIM5 orthologs at codon resolution over the SPRY v1 patch, with a red per-codon dN/dS track above',
    thumbPosition: 'left',
  },
  {
    slug: 'spike_structure',
    category: 'Structures',
    navLabel: 'Spike and PDB 6VXX',
    title: 'The SARS-CoV-2 furin insert and PDB 6VXX',
    blurb:
      'Eleven coronavirus spikes, the four residues only SARS-CoV-2 carries, and a SIFTS correspondence recording which residues of that row PDB 6VXX resolved.',
    thumb: spikeThumb,
    thumbAlt:
      'Eleven coronavirus spike proteins with their domains as colored blocks and a track marking the residues PDB 6VXX resolved',
    thumbPosition: 'left',
  },
  {
    slug: 'protein_complex',
    category: 'Structures',
    navLabel: 'Hemoglobin interfaces',
    title: "Hemoglobin's two subunits and the interfaces between them",
    blurb:
      'Alpha and beta globin from eleven vertebrates, with the residue pairs in contact between the chains of PDB 2HHB drawn as arcs.',
    thumb: complexThumb,
    thumbAlt:
      'Eleven concatenated hemoglobin rows with arcs joining each alpha residue to the beta residue it touches in the crystal, colored by interface',
    thumbPosition: 'left',
  },
  {
    slug: 'structure_link',
    category: 'Structures',
    navLabel: 'Linked structure, live',
    title: 'An alignment linked to its structure',
    blurb:
      'The spike and hemoglobin alignments beside PDB 6VXX and 2HHB in Mol*. A residue hovered in either view lights in the other.',
    thumb: structureLinkThumb,
    thumbAlt:
      'The spike alignment on the PRRA insert above PDB 6VXX in Mol*, one SARS-CoV-2 residue shown as sticks on chain A',
    thumbPosition: 'center',
  },
  {
    slug: 'phylogeny_at_scale',
    category: 'Phylogenies and metadata',
    navLabel: 'RSV phylogeny',
    title: 'An RSV phylogeny from a public Nextstrain build',
    blurb:
      'A Nextstrain tree of 1,840 RSV genomes, reconstructed to an alignment and colored by clade, country, region and year.',
    thumb: metadataThumb,
    thumbAlt:
      'RSV tip labels colored by Nextstrain clade, green A.D rows giving way to purple A.D.3 rows, with the clade legend beside them',
    thumbPosition: 'left',
  },
  {
    slug: 'influenza_surveillance_figure',
    category: 'Phylogenies and metadata',
    navLabel: 'H5N1 surveillance figure',
    title: 'An H5N1 surveillance figure',
    blurb:
      "204 genomes from Nextstrain's H5N1 cattle-outbreak build, with host, state and one amino-acid site per segment as strips beside the HA alignment.",
    thumb: h5n1Thumb,
    thumbAlt:
      'An H5N1 tree with tip labels colored by state, nine color strips beside it, labeled brackets in the gutter and the whole tree in an overview band above',
    thumbPosition: 'left',
  },
  {
    slug: 'tem_alleles',
    category: 'Phylogenies and metadata',
    navLabel: 'TEM alleles',
    title: 'TEM beta-lactamase alleles and what they hydrolyze',
    blurb:
      "46 named TEM alleles from NCBI's Reference Gene Catalog, with each one's phenotype and its residues at the Ambler resistance positions.",
    thumb: temThumb,
    thumbAlt:
      'Forty-six TEM allele rows with a phenotype strip and eight residue strips beside the tree, tip labels colored by phenotype',
    thumbPosition: 'left',
  },
  {
    slug: 'mitogenome_genes',
    category: 'Genomes and recombination',
    navLabel: 'Mitochondrial genomes',
    title: 'Eight mitochondrial genomes and the genes on them',
    blurb:
      'Eight mammal mitogenomes from RefSeq as one alignment, with all 37 genes per genome drawn as strand arrows colored by respiratory complex.',
    thumb: mitoThumb,
    thumbAlt:
      'Eight mammal mitochondrial genomes as rows of gene arrows, colored by respiratory complex and labeled by gene name',
    thumbPosition: 'left',
  },
  {
    slug: 'gene_neighborhoods',
    category: 'Genomes and recombination',
    navLabel: 'Gene neighborhoods',
    title: 'Gene neighborhoods of the tryptophan operon',
    blurb:
      'Twelve bacterial genomes, 8 kb either side of trpB, drawn as gene arrows beside a tree built from TrpB.',
    thumb: neighborhoodThumb,
    thumbAlt:
      'Twelve rows of bacterial gene arrows aligned on trpE, the trp operon reading as columns of color beside the TrpB tree',
    thumbPosition: 'left',
  },
  {
    slug: 'recombination_breakpoint',
    category: 'Genomes and recombination',
    navLabel: 'XBB recombination',
    title: "The recombination breakpoint in XBB's spike gene",
    blurb:
      'Five SARS-CoV-2 genomes aligned whole, with the recombinant XBB.1 scanned against its two BA.2 parents to place the breakpoint.',
    thumb: recombinantThumb,
    thumbAlt:
      'Five SARS-CoV-2 genome rows under two bar tracks counting the differences between the recombinant row and each parent, one falling to zero where the other rises',
    thumbPosition: 'left',
  },
  {
    slug: 'norovirus_recombination',
    category: 'Genomes and recombination',
    navLabel: 'Norovirus recombination',
    title: 'Recombination at the norovirus ORF1/ORF2 junction',
    blurb:
      'Twelve norovirus GII genomes aligned whole, with one tree from the ORF1 columns and another from the ORF2 columns.',
    thumb: norovirusThumb,
    thumbAlt:
      'Twelve norovirus rows of 200-base windows colored by closer parent, three of them turning from blue to red at the ORF1/ORF2 junction',
    thumbPosition: 'left',
  },
  {
    slug: 'r_protease_triad',
    category: 'R, Python and JBrowse',
    navLabel: 'Protease family in R',
    title: 'A protease family in R',
    blurb:
      'Fourteen peptidase S1 domains from UniProt, aligned with DECIPHER, a tree from ape, and two layers R computes.',
    thumb: proteaseThumb,
    thumbAlt:
      'The GDSGGP motif of nine serine proteases beside five relatives that read A, M, Y or G at the catalytic serine',
    thumbPosition: 'left',
  },
  {
    slug: 'notebook_flu_drift',
    category: 'R, Python and JBrowse',
    navLabel: 'Flu drift in Python',
    title: 'Influenza drift in a notebook',
    blurb:
      '25 H3N2 vaccine strains from 1968 to 2022 as one hemagglutinin alignment in Jupyter, with a count of how often each column changed.',
    thumb: fluThumb,
    thumbAlt:
      'Antigenic site B across 25 influenza vaccine strains in year order, the letters under the two bands turning over every few rows',
    thumbPosition: 'left',
  },
  {
    slug: 'jbrowse_integration',
    category: 'R, Python and JBrowse',
    navLabel: 'JBrowse 2 integration',
    title: 'JBrowse 2 integration',
    blurb:
      'The same alignment and tree opened inside JBrowse 2 beside a genome view and an AlphaFold structure, each session a single URL.',
    thumb: jbrowseThumb,
    thumbAlt:
      'One JBrowse session holding the TP53 gene with ClinVar, the p53 ortholog alignment and the AlphaFold structure, connected',
    thumbPosition: 'center',
  },
]
