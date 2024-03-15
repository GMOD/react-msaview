import { types, addDisposer } from 'mobx-state-tree'
import { autorun } from 'mobx'

// locals
import { parseGFF } from './parseGFF'

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
            const accessionSansVersion = accession?.replace(/\.[^/.]+$/, '')
            const url = `https://rest.uniprot.org/uniprotkb/${accessionSansVersion}.gff`
            const res = await fetch(url)
            if (!res.ok) {
              throw new Error(
                `HTTP ${res.status} fetching ${url}: ${await res.text()}`,
              )
            }
            self.setData(await res.text())
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
