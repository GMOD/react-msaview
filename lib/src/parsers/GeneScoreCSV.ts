type GeneScore = {
  geneScore: string,
  diffCount: string,
  accessionId: string
}

const GeneScoreCSV = (text: string | undefined) => {
  if (text === undefined) return {}

  var scores: { [name: string]: GeneScore } = {}
  text.split('\n').forEach(line => {
    var key = ''

    var geneScore = {
      geneScore: '',
      diffCount: '',
      accessionId: ''
    }

    line.split(',').forEach((element, idx) => {
      switch (idx) {
        case 0:
          key = element
          scores[key] = geneScore
          break
        case 1:
          scores[key]['geneScore'] = element
          break
        case 2:
          scores[key]['diffCount'] = element
          break
        case 3:
          scores[key]['accessionId'] = element
          break
        default:
          console.log(`Could not associate item with value in Gene Score: (${element}, ${idx})`)
      }
    })
  })

  return scores
}

export default GeneScoreCSV