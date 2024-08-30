const colorSchemes = {
  none: {},
  clustal: {
    G: 'orange',
    P: 'orange',
    S: 'orange',
    T: 'orange',
    H: 'red',
    K: 'red',
    R: 'red',
    F: 'blue',
    W: 'blue',
    Y: 'blue',
    I: 'green',
    L: 'green',
    M: 'green',
    V: 'green',
  },
  lesk: {
    G: 'orange',
    A: 'orange',
    S: 'orange',
    T: 'orange',
    C: 'green',
    V: 'green',
    I: 'green',
    L: 'green',
    P: 'green',
    F: 'green',
    Y: 'green',
    M: 'green',
    W: 'green',
    N: 'magenta',
    Q: 'magenta',
    H: 'magenta',
    D: 'red',
    E: 'red',
    K: 'blue',
    R: 'blue',
  },
  maeditor: {
    A: 'lightgreen',
    G: 'lightgreen',
    C: 'green',
    D: 'darkgreen',
    E: 'darkgreen',
    N: 'darkgreen',
    Q: 'darkgreen',
    I: 'blue',
    L: 'blue',
    M: 'blue',
    V: 'blue',
    F: '#c8a2c8',
    W: '#c8a2c8',
    Y: '#c8a2c8',
    H: 'darkblue',
    K: 'orange',
    R: 'orange',
    P: 'pink',
    S: 'red',
    T: 'red',
  },

  percent_identity_dynamic: {},
  // https://github.com/biotite-dev/biotite/blob/8c460972f8ab904312f130dfb80f3efc8c9bd7c5/src/biotite/sequence/graphics/color_schemes/flower.json
  flower: {
    A: '#b18a51',
    C: '#ff5701',
    D: '#01a578',
    E: '#2da0a1',
    F: '#fa559d',
    G: '#b1c23c',
    H: '#0194f9',
    I: '#f27663',
    K: '#7fc3d7',
    L: '#df6e75',
    M: '#fe9daf',
    N: '#0bcec6',
    P: '#4fa32a',
    Q: '#7295ae',
    R: '#83bff1',
    S: '#b4bd9b',
    T: '#d2b576',
    V: '#fd997b',
    W: '#ff2ded',
    Y: '#c96ecf',
  },
  rainbow_dna: {
    A: '#3737f5',
    C: '#37f537',
    G: '#f5f537',
    T: '#f53737',
    U: '#f53737',
  },

  // https://github.com/biotite-dev/biotite/blob/8c460972f8ab904312f130dfb80f3efc8c9bd7c5/src/biotite/sequence/graphics/color_schemes/clustalx_protein.json
  clustalx_protein: {
    A: '#197fe5',
    C: '#e57f7f',
    D: '#cc4ccc',
    E: '#cc4ccc',
    F: '#197fe5',
    G: '#e5994c',
    H: '#19b2b2',
    I: '#197fe5',
    K: '#e53319',
    L: '#197fe5',
    M: '#197fe5',
    N: '#19cc19',
    P: '#cccc00',
    Q: '#19cc19',
    R: '#e53319',
    S: '#19cc19',
    T: '#19cc19',
    V: '#197fe5',
    W: '#197fe5',
    Y: '#19b2b2',
  },

  // this has special handling
  clustalx_protein_dynamic: {},

  clustalx_dna: {
    A: '#e53319',
    C: '#197fe5',
    G: '#e5994c',
    T: '#19cc19',
    U: '#19cc19',
  },
  jalview_buried: {
    A: '#00a35c',
    R: '#00fc03',
    N: '#00eb14',
    D: '#00eb14',
    C: '#0000ff',
    Q: '#00f10e',
    E: '#00f10e',
    G: '#009d62',
    H: '#00d52a',
    I: '#0054ab',
    L: '#007b84',
    K: '#00ff00',
    M: '#009768',
    F: '#008778',
    P: '#00e01f',
    S: '#00d52a',
    T: '#00db24',
    W: '#00a857',
    Y: '#00e619',
    V: '#005fa0',
    B: '#00eb14',
    X: '#00b649',
    Z: '#00f10e',
  },

  jalview_hydrophobicity: {
    A: '#ad0052',
    R: '#0000ff',
    N: '#0c00f3',
    D: '#0c00f3',
    C: '#c2003d',
    Q: '#0c00f3',
    E: '#0c00f3',
    G: '#6a0095',
    H: '#1500ea',
    I: '#ff0000',
    L: '#ea0015',
    K: '#0000ff',
    M: '#b0004f',
    F: '#cb0034',
    P: '#4600b9',
    S: '#5e00a1',
    T: '#61009e',
    W: '#5b00a4',
    Y: '#4f00b0',
    V: '#f60009',
    B: '#0c00f3',
    X: '#680097',
    Z: '#0c00f3',
  },

  jalview_prophelix: {
    A: '#e718e7',
    R: '#6f906f',
    N: '#1be41b',
    D: '#778877',
    C: '#23dc23',
    Q: '#926d92',
    E: '#ff00ff',
    G: '#00ff00',
    H: '#758a75',
    I: '#8a758a',
    L: '#ae51ae',
    K: '#a05fa0',
    M: '#ef10ef',
    F: '#986798',
    P: '#00ff00',
    S: '#36c936',
    T: '#47b847',
    W: '#8a758a',
    Y: '#21de21',
    V: '#857a85',
    B: '#49b649',
    X: '#758a75',
    Z: '#c936c9',
  },

  jalview_propstrand: {
    A: '#5858a7',
    R: '#6b6b94',
    N: '#64649b',
    D: '#2121de',
    C: '#9d9d62',
    Q: '#8c8c73',
    E: '#0000ff',
    G: '#4949b6',
    H: '#60609f',
    I: '#ecec13',
    L: '#b2b24d',
    K: '#4747b8',
    M: '#82827d',
    F: '#c2c23d',
    P: '#2323dc',
    S: '#4949b6',
    T: '#9d9d62',
    W: '#c0c03f',
    Y: '#d3d32c',
    V: '#ffff00',
    B: '#4343bc',
    X: '#797986',
    Z: '#4747b8',
  },

  jalview_propturn: {
    A: '#2cd3d3',
    R: '#708f8f',
    N: '#ff0000',
    D: '#e81717',
    C: '#a85757',
    Q: '#3fc0c0',
    E: '#778888',
    G: '#ff0000',
    H: '#708f8f',
    I: '#00ffff',
    L: '#1ce3e3',
    K: '#7e8181',
    M: '#1ee1e1',
    F: '#1ee1e1',
    P: '#f60909',
    S: '#e11e1e',
    T: '#738c8c',
    W: '#738c8c',
    Y: '#9d6262',
    V: '#07f8f8',
    B: '#f30c0c',
    X: '#7c8383',
    Z: '#5ba4a4',
  },

  jalview_taylor: {
    A: '#ccff00',
    R: '#0000ff',
    N: '#cc00ff',
    D: '#ff0000',
    C: '#ffff00',
    Q: '#ff00cc',
    E: '#ff0066',
    G: '#ff9900',
    H: '#0066ff',
    I: '#66ff00',
    L: '#33ff00',
    K: '#6600ff',
    M: '#00ff00',
    F: '#00ff66',
    P: '#ffcc00',
    S: '#ff3300',
    T: '#ff6600',
    W: '#00ccff',
    Y: '#00ffcc',
    V: '#99ff00',
  },

  jalview_zappo: {
    A: '#ffafaf',
    R: '#6464ff',
    N: '#00ff00',
    D: '#ff0000',
    C: '#ffff00',
    Q: '#00ff00',
    E: '#ff0000',
    G: '#ff00ff',
    H: '#6464ff',
    I: '#ffafaf',
    L: '#ffafaf',
    K: '#6464ff',
    M: '#ffafaf',
    F: '#ffc800',
    P: '#ff00ff',
    S: '#00ff00',
    T: '#00ff00',
    W: '#ffc800',
    Y: '#ffc800',
    V: '#ffafaf',
  },

  cinema: {
    H: 'blue',
    K: 'blue',
    R: 'blue',
    D: 'red',
    E: 'red',
    S: 'green',
    T: 'green',
    N: 'green',
    Q: 'green',
    A: 'white',
    V: 'white',
    L: 'white',
    I: 'white',
    M: 'white',
    F: 'magenta',
    W: 'magenta',
    Y: 'magenta',
    P: 'brown',
    G: 'brown',
    C: 'yellow',
    B: 'gray',
    Z: 'gray',
    X: 'gray',
    '-': 'gray',
    '.': 'gray',
  },
} as Record<string, Record<string, string>>

// turn all supplied colors to hex colors which getContrastText from mui
// requires
export default colorSchemes

// info http://www.jalview.org/help/html/colourSchemes/clustal.html
// modifications:
// reference to clustalX source code scheme modifies what the jalview.org
// scheme says there the jalview.org colorscheme says WLVIMAFCHP but it
// should be WLVIMAFCHPY, colprot.xml says e.g. %#ACFHILMVWYPp" which has Y
export function getClustalXColor(
  stats: Record<string, number>,
  total: number,
  model: { columns: Record<string, string> },
  row: string,
  col: number,
) {
  const l = model.columns[row]![col]!
  const {
    W = 0,
    L = 0,
    V = 0,
    I = 0,
    M = 0,
    A = 0,
    F = 0,
    C = 0,
    H = 0,
    P = 0,
    R = 0,
    K = 0,
    Q = 0,
    E = 0,
    D = 0,
    T = 0,
    S = 0,
    G = 0,
    Y = 0,
    N = 0,
  } = stats

  const WLVIMAFCHP = W + L + V + I + M + A + F + C + H + P + Y

  const KR = K + R
  const QE = Q + E
  const ED = E + D
  const TS = T + S

  if (WLVIMAFCHP / total > 0.6) {
    if (
      l === 'W' ||
      l === 'L' ||
      l === 'V' ||
      l === 'A' ||
      l === 'I' ||
      l === 'M' ||
      l === 'F' ||
      l === 'C'
    ) {
      // blue from jalview.org docs
      return 'rgb(128,179,230)'
    }
  }

  if (
    (l === 'K' || l === 'R') &&
    (KR / total > 0.6 || K / total > 0.8 || R / total > 0.8 || Q / total > 0.8)
  ) {
    return '#d88'
  }

  if (
    l === 'E' &&
    (KR / total > 0.6 ||
      QE / total > 0.5 ||
      E / total > 0.8 ||
      Q / total > 0.8 ||
      D / total > 0.8)
  ) {
    return 'rgb(192, 72, 192)'
  }

  if (
    l === 'D' &&
    (KR / total > 0.6 ||
      ED / total > 0.5 ||
      K / total > 0.8 ||
      R / total > 0.8 ||
      Q / total > 0.8)
  ) {
    return 'rgb(204, 77, 204)'
  }

  if (l === 'N' && (N / total > 0.5 || Y / total > 0.85)) {
    return '#8f8'
  }
  if (
    l === 'Q' &&
    (KR / total > 0.6 ||
      QE / total > 0.6 ||
      Q / total > 0.85 ||
      E / total > 0.85 ||
      K / total > 0.85 ||
      R / total > 0.85)
  ) {
    return '#8f8'
  }

  if (
    (l === 'S' || l === 'T') &&
    // WLVIMAFCHP modified from 0.6 to 0.55 on page to match what i see in jalview
    (WLVIMAFCHP / total > 0.6 ||
      TS / total > 0.5 ||
      S / total > 0.85 ||
      T / total > 0.85)
  ) {
    return 'rgb(26,204,26)'
  }

  if (l === 'C' && C / total > 0.85) {
    return 'rgb(240, 128, 128)'
  }

  if (l === 'G' && G / total > 0) {
    return 'rgb(240, 144, 72)'
  }
  if (l === 'P' && P / total > 0) {
    return 'rgb(204, 204, 0)'
  }

  if (
    (l === 'H' || l === 'Y') &&
    (WLVIMAFCHP / total > 0.6 ||
      W > 0.85 ||
      Y > 0.85 ||
      A > 0.85 ||
      C > 0.85 ||
      P > 0.85 ||
      Q > 0.85 ||
      F > 0.85 ||
      H > 0.85 ||
      I > 0.85 ||
      L > 0.85 ||
      M > 0.85 ||
      V > 0.85)
  ) {
    // cyan from jalview.org docs
    return 'rgb(26, 179, 179)'
  }
  return undefined
}

// info http://www.jalview.org/help/html/colourSchemes/clustal.html
// modifications:
// reference to clustalX source code scheme modifies what the jalview.org
// scheme says there the jalview.org colorscheme says WLVIMAFCHP but it should
// be WLVIMAFCHPY, colprot.xml says e.g. %#ACFHILMVWYPp" which has Y
export function getPercentIdentityColor(
  stats: Record<string, number>,
  total: number,
  model: { columns: Record<string, string> },
  row: string,
  col: number,
) {
  const l = model.columns[row]![col]!
  const entries = Object.entries(stats)
  let ent = 0
  let letter = ''
  for (const entry of entries) {
    if (entry[1] > ent && entry[0] !== '-') {
      letter = entry[0]
      ent = entry[1]
    }
  }
  const proportion = ent / total
  const thresh = `hsl(240, 30%, ${100 * Math.max(1 - ent / total / 3, 0.3)}%)`
  if (proportion > 0.4) {
    if (l === letter) {
      return thresh
    }
  }
}
