// Applied before every test file — mirrors the patch in index.ts
;(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString()
}
