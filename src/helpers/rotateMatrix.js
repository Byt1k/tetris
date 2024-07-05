export const rotateMatrix = matrix => {
  const N = matrix.length - 1

  return matrix.map((row, i) =>
      row.map((val, j) => matrix[N - j][i])
  )
}