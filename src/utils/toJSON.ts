import {Arrays} from "@utils";
import {FrameModel, PinModel, ToplComModel} from "@mybricks/desn-topl-view";
import {SlotModel} from "@mybricks/desn-geo-view";
import SPAContext from "../SPAContext";

import {getJSONFromModule} from '@mybricks/file-parser'

export function toJSON(mpaContext: SPAContext) {
  const {model} = mpaContext

  const mainSlot = model.mainModule.slot
  const mainFrame = model.mainModule.frame

  let slot, frame
  if (mainSlot?.slots) {
    mainSlot.slots.forEach(s => {
      slot = s
    })
  }

  if (mainFrame?.frames) {
    mainFrame.frames.forEach(f => {
      frame = f
    })
  }

  const json = getJSONFromModule({slot, frame})

  return json
}

// function toScript() {
//   return function (fns) {
//     const PinRels = '__pinRelsReg__'
//     const Cons = '__consReg__'
//     const Coms = '__comsReg__'
//     const ComsAutoRun = '__comsAutoRun__'
//
//     const {_getSlotProps, _getComProps} = fns({Coms, PinRels, Cons, ComsAutoRun})
//
//     return {
//       get(comId: string, _slotId: string, _scope: { id: string }) {
//         let slotId, scope
//         for (let i = 0; i < arguments.length; i++) {
//           if (i > 0 && typeof arguments[i] === 'string') {
//             slotId = arguments[i]
//           }
//           if (typeof arguments[i] === 'object') {
//             scope = arguments[i]
//           }
//         }
//
//         if (slotId) {
//           return _getSlotProps(comId, slotId)
//         } else {
//           return _getComProps(comId, scope)
//         }
//       }
//     }
//   }
// }