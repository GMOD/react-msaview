import { SnapshotIn, cast, types } from 'mobx-state-tree'
import { StructureModel } from './StructureModel'

export type StructureSnap = SnapshotIn<typeof StructureModel>

export function SelectedStructuresMixin() {
  return types
    .model({
      /**
       * #property
       * currently "selected" structures, generally PDB 3-D protein structures
       */
      selectedStructures: types.array(StructureModel),
    })
    .actions(self => ({
      /**
       * #action
       * add to the selected structures
       */
      addStructureToSelection(elt: StructureSnap) {
        self.selectedStructures.push(elt)
      },

      /**
       * #action
       * remove from the selected structures
       */
      removeStructureFromSelection(elt: StructureSnap) {
        const r = self.selectedStructures.find(node => node.id === elt.id)
        if (r) {
          self.selectedStructures.remove(r)
        }
      },

      /**
       * #action
       * toggle a structure from the selected structures list
       */
      toggleStructureSelection(elt: {
        id: string
        structure: { startPos: number; endPos: number; pdb: string }
      }) {
        const r = self.selectedStructures.find(node => node.id === elt.id)
        if (r) {
          self.selectedStructures.remove(r)
        } else {
          self.selectedStructures.push(elt)
        }
      },

      /**
       * #action
       * clear all selected structures
       */
      clearSelectedStructures() {
        self.selectedStructures = cast([])
      },
    }))
}
