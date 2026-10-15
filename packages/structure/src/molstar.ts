import type { Structure } from 'molstar/lib/mol-model/structure'
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context'

function importMolstar() {
  return Promise.all([
    import('molstar/lib/mol-plugin-ui'),
    import('molstar/lib/mol-plugin-ui/react18'),
    import('molstar/lib/mol-plugin-ui/spec'),
    import('molstar/lib/mol-plugin/config'),
    import('molstar/lib/mol-model/structure'),
    import('molstar/lib/mol-script/script'),
    import('molstar/lib/mol-plugin-state/helpers/structure-overpaint'),
    import('molstar/lib/mol-util/color'),
    import('molstar/lib/mol-plugin-state/transforms'),
    import('molstar/lib/mol-math/linear-algebra'),
    import('molstar/build/viewer/molstar.css'),
  ]).then(
    ([
      ui,
      react18,
      spec,
      config,
      structure,
      script,
      overpaint,
      color,
      transforms,
      linearAlgebra,
    ]) => ({
      createPluginUI: ui.createPluginUI,
      renderReact18: react18.renderReact18,
      DefaultPluginUISpec: spec.DefaultPluginUISpec,
      PluginConfig: config.PluginConfig,
      StructureElement: structure.StructureElement,
      StructureProperties: structure.StructureProperties,
      StructureSelection: structure.StructureSelection,
      Script: script.Script,
      setStructureOverpaint: overpaint.setStructureOverpaint,
      clearStructureOverpaint: overpaint.clearStructureOverpaint,
      Color: color.Color,
      StateTransforms: transforms.StateTransforms,
      Mat4: linearAlgebra.Mat4,
    }),
  )
}

let loading: ReturnType<typeof importMolstar> | undefined

/** Mol* is a large chunk, so it loads when a panel first mounts */
export function loadMolstar() {
  loading ??= importMolstar().catch((e: unknown) => {
    loading = undefined
    throw e
  })
  return loading
}

export type Molstar = Awaited<ReturnType<typeof importMolstar>>

function transformCell(plugin: PluginUIContext, molstar: Molstar, ref: string) {
  return plugin.state.data.selectQ(q =>
    q
      .byRef(ref)
      .subtree()
      .withTransformer(
        molstar.StateTransforms.Model.TransformStructureConformation,
      ),
  )[0]
}

/**
 * The structure a state ref draws: the transformed one once a superposition
 * has moved it, else the loaded one. A locus has to come from this structure
 * to light in the view.
 */
export function drawnStructure(
  plugin: PluginUIContext,
  molstar: Molstar,
  ref: string,
) {
  return (
    transformCell(plugin, molstar, ref) ?? plugin.state.data.cells.get(ref)
  )?.obj?.data as Structure | undefined
}

/** moves a loaded structure by a column-major 4x4, or back with the identity */
export async function transformStructure(
  plugin: PluginUIContext,
  molstar: Molstar,
  ref: string,
  matrix: number[],
) {
  const existing = transformCell(plugin, molstar, ref)
  const params = {
    transform: {
      name: 'matrix' as const,
      params: {
        data: molstar.Mat4.fromArray(molstar.Mat4(), matrix, 0),
        transpose: false,
      },
    },
  }
  const build = existing
    ? plugin.state.data.build().to(existing).update(params)
    : plugin.state.data
        .build()
        .to(ref)
        .insert(
          molstar.StateTransforms.Model.TransformStructureConformation,
          params,
        )
  await plugin.runTask(plugin.state.data.updateTree(build))
}

/**
 * The residues of one chain by `label_seq_id`. A generated mapping names the
 * chain by the author id RCSB reports and a hand-written one by the label id,
 * and the two differ for many entries, so a chain matches on either.
 */
export function residueLoci(
  molstar: Molstar,
  structure: Structure,
  labelSeqIds: number[],
  chain?: string,
) {
  const selection = molstar.Script.getStructureSelection(
    Q =>
      Q.struct.generator.atomGroups({
        ...(chain
          ? {
              'chain-test': Q.core.logic.or([
                Q.core.rel.eq([
                  Q.struct.atomProperty.macromolecular.label_asym_id(),
                  chain,
                ]),
                Q.core.rel.eq([
                  Q.struct.atomProperty.macromolecular.auth_asym_id(),
                  chain,
                ]),
              ]),
            }
          : {}),
        'residue-test': Q.core.set.has([
          Q.core.type.set(labelSeqIds),
          Q.struct.atomProperty.macromolecular.label_seq_id(),
        ]),
      }),
    structure,
  )
  return molstar.StructureSelection.toLociWithSourceUnits(selection)
}

export interface PolymerResidue {
  labelAsymId: string
  authAsymId: string
  labelSeqId: number
}

export function polymerResidues(molstar: Molstar, structure: Structure) {
  const SP = molstar.StructureProperties
  const residues = new Map<string, PolymerResidue>()
  molstar.StructureElement.Loci.forEachLocation(
    molstar.StructureElement.Loci.all(structure),
    loc => {
      if (SP.entity.type(loc) === 'polymer') {
        const labelAsymId = SP.chain.label_asym_id(loc)
        const labelSeqId = SP.residue.label_seq_id(loc)
        residues.set(`${labelAsymId}:${labelSeqId}`, {
          labelAsymId,
          authAsymId: SP.chain.auth_asym_id(loc),
          labelSeqId,
        })
      }
    },
  )
  return [...residues.values()]
}
