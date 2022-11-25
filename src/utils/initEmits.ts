import {ComRuntimeModel, ComSeedModel, NS_Emits, T_XGraphComDef} from "@sdk";
import {useEffect} from "react";
import SPAContext from "../SPAContext";

import {deserialize, dump, implement, redo, undo, uuid} from "@mybricks/rxui";
import {deepClone} from "@utils";
import {GeoComModel} from "@mybricks/desn-geo-view";
import {DiagramModel, ToplComModel} from "@mybricks/desn-topl-view";
import {unstable_batchedUpdates} from "react-dom";

export default function initEmits(spaContext: SPAContext) {
  const {desnContext} = spaContext

  //implement(NS_Emits.Debug, {from: 'children', expectTo: 'children'})
  implement(NS_Emits.Frame, {from: 'children', expectTo: 'children'})
  implement(NS_Emits.IOCAbout, {from: 'children', expectTo: 'children'})

  //implement(NS_Emits.Diagram, {from: 'children', expectTo: 'children'})

  implement(NS_Emits.Component, next => next({
    focus(model) {
      desnContext.focus(model as any)
    },
    reFocus(model) {
      desnContext.reFocus(model as any)
    },
    blur() {
      desnContext.blur()
    },
    upgrade(comSeed, all?) {
      upgrade(comSeed, spaContext, all)
    },
    upgradeAllForDef(comDef: T_XGraphComDef) {
      upgradeAllForDef(comDef, spaContext)
    }
    // getDiagrams(){
    //   debugger
    // }
  }), {from: 'children', expectTo: 'children'})

  implement(NS_Emits.Page, next => next({
    getAll() {
      const loader = desnContext.configs.pageLoader
      if (typeof loader === 'function') {
        return loader()
      }
    }
  }), {from: 'children'})

  implement(NS_Emits.Connector, next => next({
    getAll() {
      const rtn = ary => {
        return ary.map(con => {
          return con
          // return {
          //   id: con.id,
          //   type:con.type,//mysql/https/...
          //   title: con.title,
          //   inputSchema: con.inputSchema,
          //   outputSchema: con.outputSchema,
          //   createTime: con.createTime,
          //   lastModifiedTime: con.lastModifiedTime,
          //   script: con.script
          // }
        })
      }

      const connectors = spaContext.model.connectors
      if (connectors) {
        return rtn(connectors)
      } else {
        const loader = desnContext.configs.connectorLoader
        if (typeof loader === 'function') {
          const ary = loader()
          if (Array.isArray(ary)) {
            return rtn(ary)
          }
        }
      }
    }
  }), {from: 'children'})

  // implement(NS_Emits.DataSource, next => next({
  //   getAll() {
  //     const rtn = ary => {
  //       return ary.map(con => {
  //         return {
  //           id: con.id,
  //           title: con.title,
  //           createTime: con.createTime,
  //           lastModifiedTime: con.lastModifiedTime,
  //           script: con.script
  //         }
  //       })
  //     }
  //
  //     const dataSources = spaContext.model.dataSources
  //     if (dataSources) {
  //       return rtn(dataSources)
  //     } else {
  //       const loader = desnContext.configs.dataSourceLoader
  //       if (typeof loader === 'function') {
  //         const ary = loader()
  //         if (Array.isArray(ary)) {
  //           return rtn(ary)
  //         }
  //       }
  //     }
  //   }
  // }), {from: 'children'})


  implement(NS_Emits.Views, next => next({
    hideNav() {
      spaContext.showNavView = false
    },
    showNav() {
      spaContext.showNavView = true
    },
    disableHandlers() {
      spaContext.handlersDisabled = true
    },
    enableHandlers() {
      spaContext.handlersDisabled = false
    },
    recoverSize(viewId: string) {
      const view = spaContext.model.viewSlots[viewId]
      if (view) {
        view.recoverSize()
      }
    },
    copyFocus() {
      const fs = desnContext.focusModel

      if (fs instanceof GeoComModel) {
        const rt = fs.runtime

        const oriIds = {}
        let json = dump(rt, {
          //uncompressed: true,
          map(target, prop, val) {
            if (val === rt.geo.parent) {
              return
            }

            if (val === rt.topl?.parent) {
              return
            }

            if (target instanceof ComRuntimeModel && prop === 'id') {
              const nid = uuid()
              oriIds[val] = nid
              return nid
            }

            if (target instanceof DiagramModel && prop === 'id') {
              return uuid()
            }

            return val
          }
        })

        if (Object.keys(oriIds).length > 0) {//replace id
          let sjson = JSON.stringify(json)
          Object.keys(oriIds).forEach(oid => {
            sjson = sjson.replace(new RegExp(oid, 'g'), oriIds[oid])
          })
          json = JSON.parse(sjson)
        }


        return {
          rt: json
        }
      } else if (fs instanceof ToplComModel) {
        const rt = fs.runtime
        return {
          rt: dump(rt, {
            //uncompressed: true,
            map(target, prop, val) {
              if (val === rt.geo?.parent) {
                return
              }

              if (val === rt.topl.parent) {
                return
              }

              if (target instanceof ComRuntimeModel && prop === 'id') {
                return uuid()
              }

              if (prop === 'diagramModel') {
                return
              }

              if (prop === 'conAry') {//ignore all connections
                return
              }

              return val
            }
          })
        }
      }
    },
    popView(title: string, content: Function, options?) {
      spaContext.popView(title, content, options)
    },
    maxView(title: string, content: Function, options?) {
      spaContext.maxView(title, content, options)
    },
    openInCurViewSlot(title: string, content: Function) {
      spaContext.openInCurViewSlot(title, content)
      // debugger
      //
      // spaContext.routerViewAry.push(view)
      //desnContext.setShowModelFullScreen()

      // const curModule = model.getCurModule()
      // if(curModule.slot.state.isEnabled()){
      //   oriEnable = curModule.slot
      // }else if(curModule.frame.state.isEnabled()){
      //   oriEnable = curModule.frame
      // }
      //
      // curModule.slot.state.disable()
      // curModule.frame.state.disable()
      //desnContext.setDebugDisable()
    },
    closeInCurViewSlot() {
      spaContext.closeInCurViewSlot()
      // myContext.routerViewAry.pop()
      // desnContext.setShowModelNormal()

      //oriEnable.state.enable()

      //desnContext.setDebugEnable()
    },
    getCurRootFrame() {
      return spaContext.model.getCurModule().frame
    }
  }), {from: 'children', expectTo: 'children'})

  //-----------------------------------------------------------------------

  useEffect(() => {
    if (spaContext.loaded) {
      // setTimeout(v=>{
      //   spaContext.emitItem.focus(void 0)
      // },2000)

      const keydown = e => {
        let evtKey: string = e.key
        if (evtKey !== 'Meta') {
          if ((e.ctrlKey || e.metaKey)) {
            if (e.shiftKey) {
              evtKey = 'ctrl+shift+' + evtKey
            } else {
              evtKey = 'ctrl+' + evtKey
            }
          }
        }

        //console.log('evtKey', evtKey)

        if (evtKey !== 'ctrl+s') {
          //debugger
          let tag = e.target as HTMLElement;
          if (tag.tagName.match(/INPUT|TEXTAREA/gi)
            || tag.contentEditable && tag.contentEditable == 'true') {
            return
          }
        }

        const cfgShortcuts = desnContext.configs.shortcuts
        const handlers: any[] = spaContext.listeners

        let did

        if (handlers) {
          did = handlers.find(hd => {
            if (Array.isArray(hd.keys)) {
              if (hd.keys.find(keyName => keyName === evtKey)) {
                hd.exe(e)
                return true
              }
            }
          })
        }

        if (cfgShortcuts) {
          const ary = cfgShortcuts[evtKey]
          if (Array.isArray(ary)) {
            ary.forEach(fn => {
              if (typeof fn === 'function') {
                fn()
                did = true
              }
            })
          }
        }

        if (!did) {
          if (evtKey === 'ctrl+z') {//undo
            undo.exe()
            requestAnimationFrame(() => {
              spaContext.desnContext.reFocus()
            })

            did = true
          }
          if (evtKey === 'ctrl+shift+z') {//redo
            redo.exe()

            requestAnimationFrame(() => {
              spaContext.desnContext.reFocus()
            })
            did = true
          }
        }

        if (did) {
          e.preventDefault()
          e.returnValue = false;
          return false
        }

        //console.log(evtKey,event.keyCode)
        // if (event.keyCode == 8) {
        //   debugger
        //   event.preventDefault()
        //   return
        // }

        // else{
        //   event.preventDefault()
        //   return
        // }
      }
      document.body.addEventListener('paste', onPaste.bind({mpaContext: spaContext}))

      document.addEventListener('keydown', e => {
        unstable_batchedUpdates(() => {
          keydown(e)
        })
      })

      // document.body.querySelectorAll('iframe').forEach(ifr => {
      //   const body = ifr.contentWindow.document.body
      //   body.addEventListener('keydown', keydown)
      //   body.addEventListener('paste', onPaste.bind({mpaContext: spaContext}))
      // })

      const pluginAry = desnContext.getPluginAry()
      if (pluginAry) {
        pluginAry.forEach(plugin => {
          if (typeof plugin.activate === 'function') {
            const {model} = spaContext

            const params = {
              data: desnContext.getPluginData(plugin.name),
              get pageStyle() {
                return {
                  get background() {
                    const viewModel = model.mainModule.slot
                    return viewModel.style.background
                  },
                  set background(val) {
                    const viewModel = model.mainModule.slot
                    viewModel.style.background = val
                  }
                }
              },
              get theme() {
                return {
                  set(name, value) {
                    if (typeof name !== 'string' || !name.match(/^\-\-\w+/)) {
                      throw new Error(`Invalid theme name,theme name should start with --`)
                    }

                    const exitItem = model.themes.find(item => item.name === name)
                    if (exitItem) {
                      exitItem.value = value
                    } else {
                      model.themes.push({name, value})
                    }
                  },
                  get(name) {
                    const v = model.themes.find(item => item.name === name)
                    return v ? v.value : void 0
                  },
                  remove(name) {
                    if (model.themes.find(item => item.name === name)) {
                      model.themes = model.themes.filter(item => item.name !== name)
                    }
                  }
                }
              }
            } as any


            plugin.activate(params)
          }
        })
      }


      return () => {
        document.body.removeEventListener('paste', onPaste)
        // document.body.querySelectorAll('iframe').forEach(ifr => {
        //   ifr.contentWindow.document.body.removeEventListener('paste', onPaste)
        // })
      }
    }
  }, [spaContext.loaded])
}

//-------------------------------------------------------------------

function onPaste(evt) {
  const {mpaContext} = this

  const {desnContext, emitSnap} = mpaContext

  const tag = evt.target as HTMLElement;

  if (tag.tagName.match(/INPUT|TEXTAREA/gi)
    || tag.contentEditable && tag.contentEditable == 'true') {
    return
  }

  if(evt.path&&evt.path.length>0&&evt.path[0].tagName.match(/INPUT|TEXTAREA/gi)){
    return
  }

  const clipdata = evt.clipboardData || window.clipboardData;
  const json = clipdata.getData('text/plain')
  if (json) {
    let obj
    try {
      obj = JSON.parse(json)
    } catch (ex) {

    }
    if (obj) {
      const snap = emitSnap.start('pasteComponent')
      try {
        importComponent(obj, mpaContext)

        snap.commit()
      } catch (ex) {
        console.error(ex)
        snap.cancel()
      }
    }
  }
}


export function genLoadedObj(myContext: SPAContext) {
  return {
    // importProject(content) {
    //   if (content['pageAry']) {//Project
    //     myContext.pageAry = content['pageAry']
    //     myContext.emitLogs.info(`导入数据完成.`)
    //     return true
    //   } else {
    //     myContext.emitLogs.error('导入数据失败', '非法的数据格式.')
    //   }
    // },
    // importComponent(content) {
    //   return importComponent(content, myContext)
    // },
    dump(): { [p: string]: {} } {
      return myContext.dump()
    }
  }
}

export function importComponent(json: { from, rt }, myContext: SPAContext) {
  if (!json['from'] || !json['rt']) {
    myContext.emitLogs.error(`错误的组件数据格式.`)
    return
  }

  const runtimeModel = deserialize<ComRuntimeModel>(json.rt)

  // const reGeoId = (rtModel: ComRuntimeModel) => {//set new id
  //   rtModel.id = uuid()
  //
  //   if (rtModel.geo && rtModel.geo.slots) {
  //     rtModel.geo.slots.forEach(slot => {
  //       if (slot.comAry) {
  //         slot.comAry.forEach(com => {
  //           reGeoId(com.runtime)
  //         })
  //       }
  //     })
  //   }
  // }
  //
  // reGeoId(runtimeModel)
  //
  //
  // const reToplId = (rtModel:ComRuntimeModel)=>{
  //   if(rtModel.topl&&rtModel.topl.frames){
  //     rtModel.topl.frames.forEach(frame=>{
  //       if(frame.diagramAry){
  //         frame.diagramAry.forEach(diagram=>{
  //           console.log(diagram)
  //
  //           diagram.id = uuid()
  //         })
  //       }
  //     })
  //   }
  // }
  //
  // reToplId(runtimeModel)

  json.rt = runtimeModel//replace it

  requestAnimationFrame(v => {
    myContext.emitItem.paste(json)
  })

  return true
}

// export function importComponent(json: { from, rt, geo, topl }, myContext: SPAContext) {
//   if (!json['from'] || !json['rt'] || (!json['geo'] && !json['topl'])) {
//     myContext.emitLogs.error(`错误的组件数据格式.`)
//     return
//   }
//
//   const runtimeModel = deserialize<ComRuntimeModel>(json.rt)
//
//   runtimeModel.id = uuid()//set new id
//
//   json.rt = runtimeModel//replace it
//
//   myContext.emitItem.paste(json)
//
//   return true
// }


// export function importComponent(json: { id, def, title, model, geo, topl }, myContext: SPAContext) {
//   // if (!json['def']) {
//   //   myContext.emitLogs.error('复制错误', `错误的组件数据格式.`)
//   //   return
//   // }
//
//   // if (!json['id']) {//Old version
//   //   const def = json['def']
//   //   if (def.namespace !== 'xgraph.calculate' && def.namespace !== 'power.normal-ui-pc-v2.form') {
//   //     myContext.emitLogs.error('复制错误', `兼容模式下只支持calculate和form组件.`)
//   //   }
//   //
//   //   if (def.namespace === 'xgraph.calculate') {
//   //     _pasteCalculate(json)
//   //   } else if (def.namespace === 'power.normal-ui-pc-v2.form') {
//   //     _pasteForm(json, myContext)
//   //   }
//   // }
//
//   if (!json['def'] || !json['id'] || !json['model']) {
//     myContext.emitLogs.error('复制错误', `错误的组件数据格式.`)
//     return
//   }
//
//   const COM_ID_MAPS = {}
//
//   const ComBaseModelMap = {}
//
//   function appendBaseModel(json: { id, def, title, model, geo, topl }) {
//     let baseModel = ComBaseModelMap[json.id]
//     if (!baseModel) {
//       const all = Object.assign({title: json.title}, json.def, json.model)
//       baseModel = new ComSeedModel(all)
//
//       ComBaseModelMap[json.id] = baseModel
//       COM_ID_MAPS[json.id] = baseModel.id//ID maps
//     }
//
//     json['_baseModel'] = baseModel
//
//     if (json.geo) {
//       if (Array.isArray(json.geo.slots)) {
//         json.geo.slots.forEach(slot => {
//           if (Array.isArray(slot.comAry)) {
//             slot.comAry.forEach(com => {
//               appendBaseModel(com)
//             })
//           }
//         })
//       }
//     }
//     if (json.topl) {
//       if (Array.isArray(json.topl.frames)) {
//         json.topl.frames.forEach(frame => {
//           if (Array.isArray(frame.comAry)) {
//             frame.comAry.forEach(com => {
//               appendBaseModel(com)
//             })
//           }
//         })
//       }
//     }
//
//   }
//
//   appendBaseModel(json)
//
//   json['_COM_ID_MAPS'] = COM_ID_MAPS
//
//   myContext.emitItem.paste(json)
//
//   return true
// }

export function upgrade(comModel: ComSeedModel, spaContext: SPAContext, all?) {
  const {model: dblModel, emitItem, emitMessage, emitLogs, desnContext: context, emitSnap} = spaContext
  const comDef = context.getComDef({namespace: comModel.runtime.def.namespace}) as T_XGraphComDef//max version
  if (!comDef) {
    throw new Error(`No definition found for component(${comModel.runtime.def.namespace})`)
  }

  const id = comModel.id
  const curModule = dblModel.getCurModule()

  if (all) {
    if (comModel.runtime.hasUI()) {
      if (curModule.slot) {
        const coms = curModule.slot.searchComByDef(comDef)
        if (coms) {
          coms.forEach(geoModel => {
            let toplComModel
            if (curModule.frame) {
              toplComModel = curModule.frame.searchCom(id) as ToplComModel
            }
            upgradeCom(geoModel, toplComModel, comDef, spaContext)
          })
          emitLogs.warn(`共有 ${coms.length} 个 ${comDef.title}(${comDef.namespace}) 组件 更新到 ${comDef.version} 版本.`)
        }
      }
    } else {
      if (curModule.frame) {
        const coms = curModule.frame.searchComByDef(comDef)
        if (coms) {
          coms.forEach(toplModel => {
            upgradeCom(void 0, toplModel, comDef, spaContext)
          })
          const msg = `共有 ${coms.length} 个 ${comDef.title}(${comDef.namespace}) 组件 更新到 ${comDef.version} 版本.`

          emitMessage.warn(msg)
          emitLogs.warn(msg)
        }
      }
    }
  } else {
    let geoComModel: GeoComModel, toplComModel: ToplComModel

    if (curModule.frame) {
      toplComModel = curModule.frame.searchCom(id) as ToplComModel
    }

    if (curModule.slot) {
      geoComModel = curModule.slot.searchCom(id) as GeoComModel
    }

    upgradeCom(geoComModel, toplComModel, comDef, spaContext)
  }
}

export function upgradeAllForDef(comDef: T_XGraphComDef, spaContext: SPAContext) {
  const {model: dblModel, emitItem, emitMessage, emitLogs, desnContext: context, emitSnap} = spaContext

  // const oriDefAry = context.getComDefAry(comDef.namespace)
  // if(oriDefAry){
  //   oriDefAry.forEach(def=>{
  //     def.runtime = comDef.runtime//Replace runtime
  //   })
  // }

  const curModule = dblModel.getCurModule()

  if (curModule.slot) {
    const coms = curModule.slot.searchComByDef(comDef)
    if (coms) {
      coms.forEach(geoModel => {
        let toplComModel
        if (curModule.frame) {
          toplComModel = curModule.frame.searchCom(geoModel.id) as ToplComModel
        }
        upgradeCom(geoModel, toplComModel, comDef, spaContext)
      })
      emitLogs.warn(`共有 ${coms.length} 个 ${comDef.title}(${comDef.namespace}) 组件 更新到 ${comDef.version} 版本.`)
    }
  }

  if (curModule.frame) {
    const coms = curModule.frame.searchComByDef(comDef)
    if (coms) {
      coms.forEach(toplModel => {
        upgradeCom(void 0, toplModel, comDef, spaContext)
      })
      emitLogs.warn(`共有 ${coms.length} 个 ${comDef.title}(${comDef.namespace}) 组件 更新到 ${comDef.version} 版本.`)
    }
  }
}

function upgradeCom(geoComModel: GeoComModel, toplComModel: ToplComModel, comDef: T_XGraphComDef, spaContext: SPAContext) {
  const {model: dblModel, emitItem, emitMessage, emitLogs, desnContext: context, emitSnap} = spaContext
  const curModule = dblModel.getCurModule()

  const comRuntimeModel = geoComModel ? geoComModel.runtime : toplComModel.runtime

  let upgradeContinue: boolean = false

  if (typeof comDef.upgrade === 'function') {
    const params: { data, slot, input, output, style, isAutoRun, setAutoRun } = {}
    params.isAutoRun = () => {
      if (toplComModel) {
        return toplComModel._autoRun
      }
    }

    params.setAutoRun = (f) => {
      if (toplComModel) {
        return toplComModel.setAutoRun(f)
      }
    }

    params.data = comRuntimeModel.model.data

    if (curModule.frame && toplComModel) {
      params.input = toplComModel.getInputEditor(emitItem)
      params.output = toplComModel.getOutputEditor(emitItem)
    }

    if (geoComModel) {
      params.slot = geoComModel.getSlotEditor({emitItem, context, emitSnap, emitMessage})
      params.style = geoComModel.style
    }

    try {
      // setTimeout(v=>{
      //
      // })
      const rtn = comDef.upgrade(params)
      if (typeof rtn === 'boolean' && !rtn) {
        upgradeContinue = false
      } else {
        upgradeContinue = true
      }
    } catch (ex) {
      emitMessage.error(`更新失败.\n${ex.message}`)
      return
    }
  } else {
    upgradeContinue = true
  }

  if (upgradeContinue) {
    // const mInputAry: PinModel[] = toplComModel.inputPins || []
    // const defInPutAry: T_IOPin[] = comDef.inputs || []
    //
    // const mOutputAry: PinModel[] = toplComModel.outputPins || []
    // const defOutputAry: T_IOPin[] = comDef.outputs || []
    //
    // if (mInputAry.length !== defInPutAry.length) {
    //   const oriAry = toplComModel.inputPins
    //   toplComModel.inputPins = []
    //
    //   defInPutAry.forEach(pin => {
    //     const newPin = toplComModel.addInputPin(pin.id, pin.title, pin.schema)
    //
    //     const oriPin = oriAry.find(opin => opin.hostId === pin.id)
    //     if (oriPin && oriPin.conAry) {
    //       oriPin.conAry.forEach(con => {
    //         con.finishPin = newPin
    //         newPin.addCon(con)
    //       })
    //     }
    //   })
    // }
    //
    // if (mOutputAry.length !== defOutputAry.length) {
    //   const oriAry = toplComModel.outputPins
    //   toplComModel.outputPins = []
    //
    //   defOutputAry.forEach(pin => {
    //     const newPin = toplComModel.addOutputPin(pin.id, pin.title, pin.schema)
    //
    //     const oriPin = oriAry.find(opin => opin.hostId === pin.id)
    //     if (oriPin && oriPin.conAry) {
    //       oriPin.conAry.forEach(con => {
    //         con.startPin = newPin
    //         newPin.addCon(con)
    //       })
    //     }
    //   })
    // }

    comRuntimeModel.def.version = comDef.version
    comRuntimeModel.upgrade = void 0

    const msg = `${comDef.title}(${comDef.namespace}) 已更新到 ${comDef.version} 版本.`

    emitMessage.warn(msg)
    emitLogs.warn(msg)
  } else {
    const msg = `更新${comDef.title}(${comDef.namespace})失败.`

    emitMessage.error(msg)
    emitLogs.error(msg)
  }
}

function _pasteForm(json, myContext: SPAContext) {
  json['id'] = uuid()

  const comDef: T_XGraphComDef = myContext.desnContext.getComDef(json.def)
  if (!comDef) {
    myContext.emitLogs.error('复制错误', `未找到组件定义.`)
  }

  if (!json['geo']) {
    const geo = {
      id: json['id'],
      slots: void 0
    }
    if (comDef.slots) {
      geo.slots = comDef.slots.map(slot => {
        return {
          id: slot.id,
          title: slot.title
        }
      })
    }

    json['geo'] = geo
  }

  if (!json['topl']) {
    let inputPins, outputPins
    if (comDef.inputs) {
      inputPins = comDef.inputs.map(pin => {
        return {
          "id": uuid(),
          "type": "normal",
          "direction": "input",
          "hostId": pin.id,
          "title": pin.title,
          "schema": deepClone(pin.schema),
          "deletable": false
        }
      })
    }

    if (comDef.inputs) {
      outputPins = comDef.outputs.map(pin => {
        return {
          "id": uuid(),
          "type": "normal",
          "direction": "output",
          "hostId": pin.id,
          "title": pin.title,
          "schema": deepClone(pin.schema),
          "deletable": false
        }
      })
    }

    const inputs = json.model.inputAry

    const inputPinsInModel = inputs.map(pin => {
      return {
        "id": uuid(),
        "type": "normal",
        "direction": "input",
        "hostId": pin.hostId,
        "title": pin.title,
        "schema": {
          "request": [
            {
              "type": "follow"
            }
          ],
          "response": [
            {
              "type": "follow"
            }
          ]
        },
        "deletable": true
      }
    })

    const outputs = json.model.outputAry

    const outputPinsInModel = outputs.map(pin => {
      return {
        "id": uuid(),
        "type": "normal",
        "direction": "output",
        "hostId": pin.hostId,
        "title": pin.title,
        "schema": {
          "request": [
            {
              "type": "follow"
            }
          ],
          "response": [
            {
              "type": "follow"
            }
          ]
        },
        "deletable": true
      }
    })

    json['topl'] = {
      id: json['id'],
      inputPins,
      outputPins,
      inputPinsInModel,
      outputPinsInModel
    }
  }
}

function _pasteCalculate(json) {
  json.id = uuid()

  json.def = {
    namespace: 'power.normal-logic.scratch',
    rtType: 'js'
  }

  json._from_ = {
    type: "comInDiagram"
  }

  const inputs = json.model.inputAry

  const data = json.model.data

  const fns = []

  Object.keys(data.scripts).forEach(varName => {
    const inputPin = inputs.find(pin => pin.hostId === varName)

    fns.push({
      id: varName,
      title: varName === '_default_' ? '默认执行' : inputPin.title,
      vars: data.vars[varName],
      xml: data.xmls[varName],
      script: data.scripts[varName]
    })
  })

  const ndata = {
    inputCount: inputs.length,
    fns
  }

  json.model.data = ndata

  const inputPinsInModel = inputs.map(pin => {
    return {
      "id": uuid(),
      "type": "normal",
      "direction": "input",
      "hostId": pin.hostId,
      "title": pin.title,
      "schema": {
        "request": [
          {
            "type": "follow"
          }
        ],
        "response": [
          {
            "type": "follow"
          }
        ]
      },
      "conMax": 1,
      "deletable": true
    }
  })

  const outputs = json.model.outputAry

  const outputPinsInModel = outputs.map(pin => {
    return {
      "id": uuid(),
      "type": "normal",
      "direction": "output",
      "hostId": pin.hostId,
      "title": pin.title,
      "schema": {
        "request": [
          {
            "type": "follow"
          }
        ],
        "response": [
          {
            "type": "follow"
          }
        ]
      },
      "conMax": 1,
      "deletable": true
    }
  })

  json['topl'] = {
    id: json['id'],
    inputPinsInModel,
    outputPinsInModel
  }
}