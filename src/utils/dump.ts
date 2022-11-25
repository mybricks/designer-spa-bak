import SPAContext from "../SPAContext";
import {Arrays} from "@utils";

export function dumpJSON(spaContext: SPAContext, plugInNamespace: string) {
  const json = {refs: {},} as any

  const allToplComs = {}
  const allPinInMap = {}
  const finalFns = []

  function serializeSlot(slot, slotId?) {
    const slotRId = slotId || slot.id
    if (json.refs[slotRId]) {
      return
    }

    json.refs[slotRId] = slot

    if (slot.comAry) {
      slot.comAry.forEach((com, idx) => {
        const toplCom = allToplComs[com.id]
        if (toplCom) {
          json.refs[com.id + '_' + 'rt'] = toplCom.model

          toplCom.model.topl = {
            _R_: com.id + '_' + 'topl'//add ref
          }

          toplCom.model = {
            _R_: com.id + '_' + 'rt'
          }

          com.model = {
            _R_: com.id + '_' + 'rt'
          }
        } else {
          json.refs[com.id + '_' + 'rt'] = com.model

          com.model = {
            _R_: com.id + '_' + 'rt'
          }
        }

        com.parent = {
          _R_: slotRId
        }

        json.refs[com.id + '_' + 'geo'] = com

        slot.comAry[idx] = {
          _R_: com.id + '_' + 'geo'
        }

        if (com.slots) {
          com.slots.forEach((nslot, idx) => {
            let nslotId
            if (nslot.parentId) {//in com
              nslotId = com.id + '_slot_' + nslot.id
              serializeSlot(nslot, nslotId)
            } else {
              nslotId = nslot.id
              serializeSlot(nslot)
            }

            com.slots[idx] = {
              _R_: nslotId
            }
          })
        }
      })
    }
  }

  function serialSlots(slots) {
    json.refs[slots.id] = slots

    slots.slots.splice(1, slots.slots.length - 1)
    const slot = slots.slots[0]
    serializeSlot(slot)
    slots.slots[0] = {
      _R_: slot.id
    }


    // if (slots.slots) {
    //   slots.slots.forEach((slot, idx) => {
    //     if (idx === 0) {
    //       serializeSlot(slot)
    //       slots.slots[idx] = {
    //         _R_: slot.id
    //       }
    //     } else {
    //       //slots.slots.splice(idx, 1)
    //     }
    //   })
    // }
  }

  function serialFrame(frame, frameId?) {
    const frameRId = frameId || frame.id

    if (json.refs[frameRId]) {
      return
    }

    // if(frame.title==='对话框容器'){
    //   debugger
    // }

    json.refs[frameRId] = frame

    delete frame.diagramAry//delete it

    if (frame.parent) {
      frame.parent = {
        _R_: frame.parent.id
      }
    }

    Arrays.each((pin, idx, parentObj) => {
      pin.conAry?.forEach((id, idx) => {
        pin?.conAry[idx] = {
          _R_: id
        }
      })

      const pinId = pin.id + '_topl_' + pin.hostId
      allPinInMap[pin.id] = pinId

      pin.parent = {
        _R_: frameRId
      }

      json.refs[pinId] = pin

      parentObj[idx] = {
        _R_: pinId
      }
    }, frame.inputPins, frame.outputPins)

    if (frame.frameAry) {
      frame.frameAry.forEach((fra, idx) => {
        serialFrame(fra)
        frame.frameAry[idx] = {
          _R_: fra.id
        }
      })
    }

    if (frame.comAry) {
      frame.comAry.forEach((com, idx) => {
        const nComId = com.id + '_' + 'topl'
        // if(com.id==='u_MCaFp'){
        //   debugger
        // }
        if (json.refs[nComId]) {
          // if(com.title==='类型转换'){
          //   debugger
          // }


          return
        }
        // if(com.id==='u_Il13Y'){
        //   debugger
        // }
        com.parent = {
          _R_: frameRId
        }

        json.refs[nComId] = com

        allToplComs[com.id] = com

        const frames = []
        if (com.frames) {
          com.frames.forEach((fra, idx) => {
            const nFrameId = com.id + '_frame_' + fra.id

            fra.parent = {
              _R_: nFrameId
            }

            serialFrame(fra,nFrameId)
            frames[idx] = {
              _R_: nFrameId
            }
          })
          com.frames = frames
        }

        Arrays.each((pin, idx, parentObj) => {
          let pinId = nComId + '_' + pin.direction + '_' + pin.id
          allPinInMap[pin.id] = pinId

          pin.parent = {
            _R_: nComId
          }

          if (pin.proxyPin) {
            finalFns.push(() => {
              pin.proxyPin = {
                _R_: allPinInMap[pin.proxyPin.id]
              }
            })
          }

          if (pin.proxyForPin) {
            finalFns.push(() => {
              pin.proxyForPin = {
                _R_: allPinInMap[pin.proxyForPin.id]
              }
            })
          }

          json.refs[pinId] = pin

          parentObj[idx] = {
            _R_: pinId
          }
        }, com.configPins, com.inputPins, com.inputPinsInModel, com.inputPinExts, com.outputPins, com.outputPinsInModel, com.outputPinExts)

        frame.comAry[idx] = {
          _R_: nComId
        }
      })
    }

    if (frame.conAry) {
      finalFns.push(() => {//Wait for allToplComs
        frame.conAry.forEach(con => {
          const {id: sid, parentType: spt, parentId: spid} = con.startPin

          if (spt === 'com') {
            const toplCom = allToplComs[spid]
            if (!toplCom) {
              return
            }

            // if(spid==="u_BCF5A7E3"){
            //   debugger
            // }

            Arrays.each((pinR, idx, parentObj) => {
              const pinId = pinR['_R_'], pin = json.refs[pinId]

              if (pinId === pin?.parent?._R_ + '_output' + '_' + sid) {
                con.startPin = {
                  _R_: pinId
                }
              }
              // if(!pinId){
              //   debugger
              // }
              if (pin.id === sid) {
                pin.conAry?.find((conId, idx) => {
                  if (conId === con.id) {//string id
                    let refCon = json.refs[conId]
                    if (!refCon) {
                      refCon = json.refs[conId] = con
                    }

                    con.startPin = {
                      _R_: pinId
                    }

                    pin.conAry[idx] = {
                      _R_: conId
                    }

                    return true
                  }
                })
              }
            }, toplCom.outputPins, toplCom.outputPinsInModel, toplCom.outputPinExts)
          } else if (spt === 'frame') {
            const frame = json.refs[frameRId]//it self

            if (!frame) {
              return
            }

            Arrays.each((pinR, idx) => {
              const pinId = pinR['_R_'], pin = json.refs[pinId]
              if (pin.id === sid) {
                pin.conAry?.find((conId, idx) => {
                  const id = conId._R_
                  if (id === con.id) {//string id
                    let refCon = json.refs[id]
                    if (!refCon) {
                      refCon = json.refs[id] = con
                    }

                    con.startPin = {
                      _R_: pinId
                    }

                    pin.conAry[idx] = {
                      _R_: id
                    }

                    return true
                  }
                })
              }
            }, frame.inputPins)
          }

          const {id: fid, parentType: fpt, parentId: fpid} = con.finishPin

          if (fpt === 'com') {
            const toplCom = allToplComs[fpid]
            if (!toplCom) {
              return
            }

            // if(con.id==="u_1F3243E6"){
            //   debugger
            // }

            Arrays.each((pinR, idx, parentObj) => {
              if (pinR) {

              }
              const pinId = pinR['_R_'], pin = json.refs[pinId]

              if (pinId === pin?.parent?._R_ + '_input' + '_' + fid) {
                con.finishPin = {
                  _R_: pinId
                }
              }

              if (pin.id === fid) {
                pin.conAry?.find((conId, idx) => {
                  if (conId === con.id) {//string id
                    let refCon = json.refs[conId]
                    if (!refCon) {
                      refCon = json.refs[conId] = con
                    }

                    con.finishPin = {
                      _R_: pinId
                    }

                    pin.conAry[idx] = {
                      _R_: conId
                    }

                    return true
                  }
                })
              }
            }, toplCom.configPins, toplCom.inputPins, toplCom.inputPinsInModel, toplCom.inputPinExts)

          } else if (fpt === 'frame') {
            const frame = json.refs[frameRId]

            if (!frame) {
              return
            }

            Arrays.each((pinR, idx) => {
              const pinId = pinR['_R_'], pin = json.refs[pinId]

              if (pin.id === fid) {
                pin.conAry?.find((conId, idx) => {
                  const id = conId._R_
                  if (id === con.id) {//string id
                    let refCon = json.refs[id]
                    if (!refCon) {
                      refCon = json.refs[id] = con
                    }

                    con.finishPin = {
                      _R_: pinId
                    }

                    pin.conAry[idx] = {
                      _R_: id
                    }

                    return true
                  }
                })
              }
            }, frame.outputPins)
          }

          if (!con.startPin._R_ || !con.finishPin._R_) {
            debugger

            throw new Error(`编译错误.`)
          }

          //
          // if(!con.finishPin._R_){
          //   debugger
          // }
        })

        delete frame.conAry
      })

    }
  }

  function serialFrames(frames) {
    json.refs[frames.id] = frames

    if (frames.frames) {
      frames.frames.splice(1, frames.frames.length - 1)
      const fra = frames.frames[0]
      serialFrame(fra)
      frames.frames[0] = {
        _R_: fra.id
      }

      // frames.frames.forEach((fra, idx) => {
      //   if (idx === 0) {
      //     serialFrame(fra)
      //     frames.frames[idx] = {
      //       _R_: fra.id
      //     }
      //   } else {
      //     frames.frames.splice(idx, 1)
      //   }
      // })
    }
  }

  //-----------------------------------------------------------------------

  const {model, desnContext, emitLogs, emitMessage} = spaContext

  if (plugInNamespace) {
    const ds = model.pluginDataset
    if (ds) {
      return ds[plugInNamespace]
    }
  }

  let slots, frames

  if (model.mainModule.slot
    //&&desnContext.configs.geoView
  ) {
    slots = model.mainModule.slot.toJSON(true)

    json.slots = {
      _R_: slots.id
    }
  }

  if (model.mainModule.frame
    //&&desnContext.configs.toplView
  ) {
    frames = model.mainModule.frame.toJSON(true)

    json.frames = {
      _R_: frames.id
    }
  }

  Object.assign(json, {
    themes: model.themes
  })

  if (frames) {
    serialFrames(frames)
  }

  if (slots) {
    serialSlots(slots)
  }

  finalFns.forEach(fn => fn())
//console.log(JSON.stringify(json))
  return json
}