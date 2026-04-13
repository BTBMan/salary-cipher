module.exports = {
  TextEncoder: globalThis.TextEncoder,
  TextDecoder: globalThis.TextDecoder,
  inherits(ctor, superCtor) {
    if (!ctor || !superCtor) {
      throw new TypeError('ctor and superCtor are required')
    }

    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true,
      },
    })
  },
}
