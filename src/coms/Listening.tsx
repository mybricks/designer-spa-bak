import {useComputed, useObservable} from "@mybricks/rxui";
import {NS_Listenable} from "@sdk";
import SPAContext from "../SPAContext";

export default function Listening({spaContext}: { spaContext: SPAContext }) {

  const {desnContext} = spaContext
  useComputed(() => {
    if (desnContext.focusModelAry.length === 1) {
      const fmodel = desnContext.focusModelAry[0]
      const listeners = (fmodel as NS_Listenable.I_Listenable)?.getListeners
      if (typeof listeners === 'function') {
        spaContext.listeners = listeners()
      } else {
        spaContext.listeners = void 0
      }
    } else {
      spaContext.listeners = void 0
    }
  })
}