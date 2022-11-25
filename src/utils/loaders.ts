import {loadLibAsJSUrl} from "@sdk";
import {clone} from "@mybricks/rxui";

export async function loadComLibs(libAry: (string | {})[]) {
  const nlib = []//clone

  const loadTasks: Promise<object>[] = []

  libAry.forEach(lib => {
    if (lib) {
      if (typeof lib === 'string') {
        loadTasks.push(loadLibAsJSUrl(lib))
      } else if (typeof lib === 'object') {
        //lib.latestComlib = {id:lib.id,version:'1.0.3'}
        // spaContext.loadComLib(lib)
        if (lib.defined) {
          const tlib = clone(lib)
          tlib.comAray = lib.comAray.map(c => c)

          nlib.push(tlib)
        } else {
          nlib.push(lib)
        }
      }
    }
  })

  const xlibAry = await Promise.all(loadTasks)
  if (xlibAry) {
    xlibAry.forEach(lib => {
      nlib.push(lib)
    })
  }

  return nlib
}