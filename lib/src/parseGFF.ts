export function parseGFF(str?: string) {
  return str
    ?.split('\n')
    .map(f => f.trim())
    .filter(f => !!f && !f.startsWith('#'))
    .map(f => {
      const [seq_id, source, type, start, end, score, strand, phase, col9] =
        f.split('\t')

      return {
        seq_id: seq_id!,
        source: source!,
        type: type!,
        start: +start!,
        end: +end!,
        score: +score!,
        strand: strand!,
        phase: phase!,
        ...Object.fromEntries(
          col9!
            .split(';')
            .map(f => f.trim())
            .filter(f => !!f)
            .map(f => f.split('='))
            .map(([key, val]) => [
              key!.trim(),
              val
                ? decodeURIComponent(val).trim().split(',').join(' ')
                : undefined,
            ]),
        ),
      }
    })
}
