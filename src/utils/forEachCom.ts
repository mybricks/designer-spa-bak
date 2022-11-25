import SPAContext from "../SPAContext";

export function forEachCom(fn: Function, spaContext: SPAContext) {
  const {model, emitLogs, desnContext} = spaContext

  if (typeof fn === 'function') {
    model.mainModule.frame.forEachCom((json) => {
      if (json.def) {//Replace
        json.def = desnContext.getComDef({
          namespace: json.def.namespace,
          version: json.def.version
        })
      }
      fn(json)
    })
  }
}