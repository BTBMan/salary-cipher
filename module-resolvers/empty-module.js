// Browser-compatible fs shim for node-tkms WASM loading.
// node-tkms calls require('fs').readFileSync(path) to load kms_lib_bg.wasm.
// In the browser, we serve it from public/ and load via synchronous XHR.
module.exports = {
  readFileSync(filePath) {
    const filename = filePath.split('/').pop()
    const xhr = new XMLHttpRequest()
    xhr.open('GET', `/${filename}`, false) // synchronous
    // Use binary string override since synchronous XHR doesn't support responseType
    xhr.overrideMimeType('text/plain; charset=x-user-defined')
    xhr.send()
    if (xhr.status >= 200 && xhr.status < 300) {
      const text = xhr.responseText
      const bytes = new Uint8Array(text.length)
      for (let i = 0; i < text.length; i++) {
        bytes[i] = text.charCodeAt(i) & 0xFF
      }
      return bytes
    }
    throw new Error(`fs shim: failed to load /${filename} (status: ${xhr.status})`)
  },
}
