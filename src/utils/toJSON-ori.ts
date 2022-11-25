import {Arrays} from "@utils";
import {FrameModel, PinModel, ToplComModel} from "@mybricks/desn-topl-view";
import {SlotModel} from "@mybricks/desn-geo-view";
import SPAContext from "../SPAContext";

export function toJSON(mpaContext: SPAContext) {
  const {model} = mpaContext

  const mainSlot = model.mainModule.slot

  let ui: { comAry, style }

  const scanSlot = (slot: SlotModel) => {
    if (slot.comAry) {
      const comAry = []
      slot.comAry.forEach(com => {
        let slots
        if (com.slots) {
          slots = {}
          com.slots.forEach(slot => {
            const comAry = scanSlot(slot)
            if (comAry) {
              slots[slot.id] = comAry
            }
          })
        }
        comAry.push({id: com.id, def: com.runtime.def, slots})
      })

      return {comAry, style: slot.style}
    }
  }

  if (mainSlot?.slots) {
    mainSlot.slots.forEach(slot => {
      ui = scanSlot(slot)
    })
  }

  //-------------------------------------------------------------------------

  const mainFrame = model.mainModule.frame

  const depsReg = []

  const inputsReg = []
  const outputsReg = []

  const pinRelsReg = {}
  const pinProxyReg = {}
  const consReg = {}
  const comsReg = {}
  const comsAutoRun = {}

  const scanInputPin = (pin: PinModel, idPre) => {
    if (pin.rels) {
      pinRelsReg[`${idPre}-${pin.hostId}`] = pin.rels
    }

    if (pin.proxyPin) {
      const comOrFrame = pin.proxyPin.parent
      if (comOrFrame instanceof FrameModel) {
        const frameId = comOrFrame.id

        if (comOrFrame) {

        }

        pinProxyReg[`${idPre}-${pin.hostId}`] = {
          type: 'frame',
          frameId,
          pinId: pin.proxyPin.hostId
        }
      }
    }
  }

  const scanOutputPin = (pin: PinModel, idPre) => {
    if (pin.conAry) {
      const cons = []
      pin.conAry.forEach(con => {
        const fPin = con.finishPin
        if (!fPin) {
          return
        }

        const pinParent = fPin.parent
        if (pinParent instanceof ToplComModel) {
          cons.push({
            type: 'com',
            startPinParentKey: con.startPinParentKey,
            finishPinParentKey: con.finishPinParentKey,
            comId: pinParent.id,
            def: pinParent.runtime.def,
            pinId: fPin.hostId,
            pinType: fPin.type,
            direction: fPin.direction,
            extBinding: fPin.extBinding
          })
        } else {
          let realFPin: PinModel
          if (fPin.forkedFrom) {//forked pin
            realFPin = fPin.forkedFrom
          } else {
            realFPin = fPin
          }

          const fp = realFPin.parent
          if (fp instanceof FrameModel) {
            const forkedFromJointPin = realFPin.forkedAsJoint//joint
            if (forkedFromJointPin) {
              const con = {
                type: 'frame',
                frameId: fp.id,
                comId: fp.parent ? fp.parent.id : void 0,
                pinId: forkedFromJointPin.hostId,
                pinType: forkedFromJointPin.type,
                direction: forkedFromJointPin.direction
              }

              cons.push(con)//{frameId, comId, pinId}

              const newIdPre = `${con.comId ? con.comId + '-' : ''}${con.frameId}`

              scanOutputPin(forkedFromJointPin, newIdPre)//scan for it
            } else {
              const comId = fp.parent instanceof ToplComModel ? fp.parent.id : void 0
              cons.push({
                type: 'frame',
                frameId: fp.id,
                comId,
                pinId: realFPin.hostId,
                pinType: realFPin.type,
                direction: realFPin.direction
              })//{frameId, comId, pinId}
            }
          }
        }
      })

      if (cons.length > 0) {
        consReg[`${idPre}-${pin.hostId}`] = cons
      }
    }
  }

  const scanFrame = (frame: FrameModel) => {
    if (frame.inputPins) {
      frame.inputPins.forEach(pin => {
        let idPre
        if (frame.parent && frame.parent instanceof ToplComModel) {
          idPre = `${frame.parent.id}-${frame.id}`
        } else if (frame.parent) {
          idPre = frame.id
        } else {
          idPre = '_rootFrame_'//_rootFrame_
        }

        scanOutputPin(pin as PinModel, idPre)

        scanInputPin(pin, idPre)//scan rels

        if (!frame.parent) {//root
          inputsReg.push({
            id: pin.hostId,
            title: pin.title,
            type: pin.type,
            schema: pin.schema,
            extValues: pin.extValues
          })
        }
      })
    }

    if (frame.outputPins) {
      frame.outputPins.forEach(pin => {
        if (!frame.parent) {//root
          outputsReg.push({
            id: pin.hostId,
            title: pin.title,
            type: pin.type,
            schema: pin.schema
          })
        }
      })
    }

    // if (frame.outputJoints) {
    //   frame.outputJoints.forEach(pin => {
    //     if (!frame.parent) {//root
    //       outputsReg.push({
    //         id: pin.hostId,
    //         title: pin.title,
    //         type: pin.type,
    //         schema: pin.schema
    //       })
    //     }
    //   })
    // }

    if (frame.comAry) {
      frame.comAry.forEach(com => {
        const def = com.runtime.def
        if (!depsReg.find(now => now.namespace === def.namespace && now.version === def.version)) {
          depsReg.push(def)
        }


        const configPinIdAry = []
        const inputPinIdAry = []
        const outPinIdAry = []

        const geo = com.runtime.geo

        comsReg[com.id] = {
          def,
          frameId: frame.parent ? frame.id : void 0,
          model: com.runtime.model,
          reservedEditorAry: geo ? geo.reservedEditorAry : void 0,
          configs: configPinIdAry,
          inputs: inputPinIdAry,
          outputs: outPinIdAry
        }
        // if(com.title==='对话框'){
        //   debugger
        // }

        if (com.configPins) {
          com.configPins.forEach(pin => {
            configPinIdAry.push(pin.hostId)
          })
        }

        Arrays.each(pin => {
          scanInputPin(pin as PinModel, com.id)
          inputPinIdAry.push(pin.hostId)
        }, ...com.getInputsAll())

        Arrays.each(pin => {
          scanOutputPin(pin as PinModel, com.id)
          outPinIdAry.push(pin.hostId)
        }, ...com.getOutputsAll())
        // if (com.runtime.def.rtType === 'js') {
        //
        // }

        if (com.isAutoRun() && def.rtType?.match(/^js/)) {
          const idPre = frame.parent ? `${frame.parent.id}-${frame.id}` : '_rootFrame_'
          let ary = comsAutoRun[idPre]
          if (!ary) {
            ary = comsAutoRun[idPre] = []
          }
          ary.push({
            id: com.id,
            def
          })
        }

        if (com.frames) {
          com.frames.forEach(frame => {
            scanFrame(frame)
          })
        }
      })
    }

    if (frame.frameAry) {
      frame.frameAry.forEach(frame => {
        scanFrame(frame)
      })
    }
  }

  if (mainFrame?.frames) {
    mainFrame.frames.forEach(frame => {
      scanFrame(frame)
    })
  }

  return {
    deps: depsReg,
    coms: comsReg,
    slot: ui,
    comsAutoRun,
    inputs: inputsReg,
    outputs: outputsReg,
    cons: consReg,
    pinRels: pinRelsReg,
    pinProxies: pinProxyReg,
  }
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