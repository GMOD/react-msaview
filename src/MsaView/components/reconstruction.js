import PhylogeneticLikelihood from "phylogenetic-likelihood";

export const getAncestralReconstruction = async data => {
  const { branches, rowData, id } = data;
  let { gapChar } = data;
  gapChar = gapChar || "-";
  const ancestralRowData = {};
  const alphSize = 20; // assume for ancestral reconstruction purposes these are protein sequences; if not we'll need to pass a different model into getNodePostProfiles
  const maxEntropy = Math.log(alphSize) / Math.log(2);
  const deletionRate = 0.001;
  const model = PhylogeneticLikelihood.models.makeGappedModel({
    model: PhylogeneticLikelihood.models[PhylogeneticLikelihood.defaultModel],
    deletionRate,
    gapChar,
  });
  const { nodeProfile } = PhylogeneticLikelihood.getNodePostProfiles({
    branchList: branches,
    nodeSeq: rowData,
    postProbThreshold: 0.01,
    model,
    defaultGapChar: gapChar,
  });
  Object.keys(nodeProfile).forEach(node => {
    ancestralRowData[node] = nodeProfile[node].map(charProb => {
      if (charProb[gapChar] >= 0.5) {
        return gapChar;
      }
      const chars = Object.keys(charProb)
        .filter(c => c !== gapChar)
        .sort((a, b) => charProb[a] - charProb[b]);
      const norm = chars.reduce((psum, c) => psum + charProb[c], 0);
      const probs = chars.map(c => charProb[c] / norm);
      const entropy =
        probs.reduce((s, p) => s - p * Math.log(p), 0) / Math.log(2);
      return chars.map((c, n) => [
        c,
        (probs[n] * (maxEntropy - entropy)) / maxEntropy,
      ]);
    });
  });
  return { id, ancestralRowData };
};
