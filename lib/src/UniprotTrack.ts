import { types, addDisposer } from 'mobx-state-tree'
import { autorun } from 'mobx'

// locals
import { parseGFF } from './util'

export const UniprotTrack = types
  .model({
    id: types.string,
    accession: types.string,
    name: types.string,
    associatedRowName: types.string,
    height: types.optional(types.number, 100),
  })
  .volatile(() => ({
    error: undefined as unknown,
    data: undefined as string | undefined,
  }))
  .actions(self => ({
    setError(error: unknown) {
      self.error = error
    },
    setData(data: string) {
      self.data = data
    },
  }))
  .actions(self => ({
    afterCreate() {
      addDisposer(
        self,
        autorun(async () => {
          try {
            const { accession } = self
            const url = `https://www.uniprot.org/uniprot/${accession}.gff`
            const response = await fetch(url)
            if (!response.ok) {
              throw new Error(
                `HTTP ${
                  response.status
                } fetching ${url}: ${await response.text()}`,
              )
            }
            self.setData(await response.text())
          } catch (e) {
            console.error(e)
            self.setError(e)
          }
        }),
      )
    },
  }))
  .views(self => ({
    get loading() {
      return !self.data
    },

    get features() {
      return parseGFF(self.data)
    },
  }))
