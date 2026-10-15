import type { Vec3 } from './cif.ts'

/** column-major 4x4, as Mol* takes a matrix with `transpose: false` */
export type Mat4 = number[]

export interface Fit {
  /** moves the first set onto the second */
  matrix: Mat4
  rmsd: number
}

type Mat3 = [Vec3, Vec3, Vec3]

function centroid(points: Vec3[]): Vec3 {
  const sum: Vec3 = [0, 0, 0]
  for (const p of points) {
    sum[0] += p[0]
    sum[1] += p[1]
    sum[2] += p[2]
  }
  const n = points.length
  return [sum[0] / n, sum[1] / n, sum[2] / n]
}

/**
 * The eigenvector of the largest eigenvalue of a symmetric 4x4, by cyclic
 * Jacobi rotations. Horn's closed form reduces a best-fit rotation to this.
 */
function dominantEigenvector(symmetric: number[][]) {
  const a = symmetric.map(row => [...row])
  const v: number[][] = [0, 1, 2, 3].map(i =>
    [0, 1, 2, 3].map(j => (i === j ? 1 : 0)),
  )
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0
    for (let p = 0; p < 3; p++) {
      for (let q = p + 1; q < 4; q++) {
        off += a[p]![q]! ** 2
      }
    }
    if (off < 1e-24) {
      break
    }
    for (let p = 0; p < 3; p++) {
      for (let q = p + 1; q < 4; q++) {
        const apq = a[p]![q]!
        if (Math.abs(apq) < 1e-30) {
          continue
        }
        const theta = (a[q]![q]! - a[p]![p]!) / (2 * apq)
        const t =
          Math.sign(theta || 1) /
          (Math.abs(theta) + Math.sqrt(theta * theta + 1))
        const c = 1 / Math.sqrt(t * t + 1)
        const s = t * c
        for (let k = 0; k < 4; k++) {
          const akp = a[k]![p]!
          const akq = a[k]![q]!
          a[k]![p] = c * akp - s * akq
          a[k]![q] = s * akp + c * akq
        }
        for (let k = 0; k < 4; k++) {
          const apk = a[p]![k]!
          const aqk = a[q]![k]!
          a[p]![k] = c * apk - s * aqk
          a[q]![k] = s * apk + c * aqk
        }
        for (let k = 0; k < 4; k++) {
          const vkp = v[k]![p]!
          const vkq = v[k]![q]!
          v[k]![p] = c * vkp - s * vkq
          v[k]![q] = s * vkp + c * vkq
        }
      }
    }
  }
  let best = 0
  for (let i = 1; i < 4; i++) {
    if (a[i]![i]! > a[best]![best]!) {
      best = i
    }
  }
  return [v[0]![best]!, v[1]![best]!, v[2]![best]!, v[3]![best]!] as const
}

function rotationOfQuaternion([w, x, y, z]: readonly [
  number,
  number,
  number,
  number,
]): Mat3 {
  return [
    [w * w + x * x - y * y - z * z, 2 * (x * y - w * z), 2 * (x * z + w * y)],
    [2 * (x * y + w * z), w * w - x * x + y * y - z * z, 2 * (y * z - w * x)],
    [2 * (x * z - w * y), 2 * (y * z + w * x), w * w - x * x - y * y + z * z],
  ]
}

export function applyMatrix(matrix: Mat4, [x, y, z]: Vec3): Vec3 {
  return [
    matrix[0]! * x + matrix[4]! * y + matrix[8]! * z + matrix[12]!,
    matrix[1]! * x + matrix[5]! * y + matrix[9]! * z + matrix[13]!,
    matrix[2]! * x + matrix[6]! * y + matrix[10]! * z + matrix[14]!,
  ]
}

export function distance(a: Vec3, b: Vec3) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

export const identityMatrix: Mat4 = [
  1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
]

/**
 * The rigid motion that best lays `moving` on `fixed`, point to point, by
 * Horn's quaternion method. Fewer than three points fix no rotation, so the
 * result is undefined.
 */
export function fitRigid(moving: Vec3[], fixed: Vec3[]): Fit | undefined {
  const n = Math.min(moving.length, fixed.length)
  if (n < 3) {
    return undefined
  }
  const a = moving.slice(0, n)
  const b = fixed.slice(0, n)
  const ca = centroid(a)
  const cb = centroid(b)
  let sxx = 0
  let sxy = 0
  let sxz = 0
  let syx = 0
  let syy = 0
  let syz = 0
  let szx = 0
  let szy = 0
  let szz = 0
  for (let i = 0; i < n; i++) {
    const p = a[i]!
    const q = b[i]!
    const px = p[0] - ca[0]
    const py = p[1] - ca[1]
    const pz = p[2] - ca[2]
    const qx = q[0] - cb[0]
    const qy = q[1] - cb[1]
    const qz = q[2] - cb[2]
    sxx += px * qx
    sxy += px * qy
    sxz += px * qz
    syx += py * qx
    syy += py * qy
    syz += py * qz
    szx += pz * qx
    szy += pz * qy
    szz += pz * qz
  }
  const q = dominantEigenvector([
    [sxx + syy + szz, syz - szy, szx - sxz, sxy - syx],
    [syz - szy, sxx - syy - szz, sxy + syx, szx + sxz],
    [szx - sxz, sxy + syx, -sxx + syy - szz, syz + szy],
    [sxy - syx, szx + sxz, syz + szy, -sxx - syy + szz],
  ])
  const norm = Math.hypot(q[0], q[1], q[2], q[3]) || 1
  const r = rotationOfQuaternion([
    q[0] / norm,
    q[1] / norm,
    q[2] / norm,
    q[3] / norm,
  ])
  const t: Vec3 = [
    cb[0] - (r[0][0] * ca[0] + r[0][1] * ca[1] + r[0][2] * ca[2]),
    cb[1] - (r[1][0] * ca[0] + r[1][1] * ca[1] + r[1][2] * ca[2]),
    cb[2] - (r[2][0] * ca[0] + r[2][1] * ca[1] + r[2][2] * ca[2]),
  ]
  const matrix = [
    r[0][0],
    r[1][0],
    r[2][0],
    0,
    r[0][1],
    r[1][1],
    r[2][1],
    0,
    r[0][2],
    r[1][2],
    r[2][2],
    0,
    t[0],
    t[1],
    t[2],
    1,
  ]
  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += distance(applyMatrix(matrix, a[i]!), b[i]!) ** 2
  }
  return { matrix, rmsd: Math.sqrt(sum / n) }
}
