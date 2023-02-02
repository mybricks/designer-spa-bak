import {useMemo} from "react";
import mybricksCoreComLib from "@mybricks/comlib-core";
import SPAContext from "../SPAContext";
import {DesignerContext, T_XGraphComDef} from "@sdk";
import {keepWatch, load as loadView, useObservable} from "@mybricks/rxui";
import {uuid} from "@utils";
import DesignerModel from "../DesignerModel";
import {GeoComModel, GeoViewModel, getRef as geoViewRef, SlotModel} from "@mybricks/desn-geo-view";
import {FrameModel, ToplViewModel} from "@mybricks/desn-topl-view";
import {PERSIST_NAME} from "../constants";
import {forEachCom} from "./forEachCom";
import {toJSON} from "./toJSON";
import {loadComLibs} from "./loaders";
import {doFrame} from "./compatible-22.12.8";

const MAIN_MODULE_ID = '_main_'

export default function initModel(spaContext: SPAContext): DesignerModel {
  const model = useObservable(DesignerModel, PERSIST_NAME)
  spaContext.model = model

  loadComLibsAndPages(spaContext)
  initStageModel(spaContext)

  return model
}

function loadComLibsAndPages(spaContext: SPAContext) {
  useMemo(async () => {
    const {desnContext, emitLogs, emitMessage} = spaContext

    //desnContext.configs = spaContext.config

    // spaContext.loadingMsg = '加载组件库...'

    const libAry = await desnContext.configs.comLibLoader()
    if (!Array.isArray(libAry)) {
      throw new Error(`Invalid comlibAry.`)
    }

    const nlib = await loadComLibs(libAry)

    //nlib.splice(0,-1,mybricksCoreComLib)

    nlib.push(mybricksCoreComLib)

    desnContext.comLibAry = nlib//init comlibs

    // async function pageLoader(){
    //   spaContext.pageLoaded = false

    //   spaContext.loadingMsg = '加载页面...'

    //   if (spaContext.config.pageLoader) {
    //     let projectData: { pageAry: any[], focusPageId: string } = await spaContext.config.pageLoader()

    //     // if (projectData && !Array.isArray(projectData['pageAry'])) {
    //     //   throw new Error(Language["Invalid file content format"])
    //     // }

    //     if (!projectData || !projectData.pageAry) {
    //       projectData = {
    //         focusPageId: 'home',
    //         pageAry: [{
    //           id: 'home',
    //           title: '首页',
    //           children: []
    //         }]
    //       }
    //     }

    //     spaContext.pageAry = projectData.pageAry

    //     const curPage = spaContext.searchPage(projectData.focusPageId)
    //     spaContext.setCurPage(curPage || spaContext.pageAry[0])
    //   }

    //   // desnContext.appendConfigs('envAppenders', {
    //   //   runtime: {
    //   //     routeTo(pageId: string, debugParams: {}) {//route in app
    //   //       mpaContext.openPage(pageId, debugParams)
    //   //     },
    //   //     openDialog(pageId: string, proxy: { inputParams, outputs }) {//openDialog in app
    //   //       emitPage.openDialog(pageId, proxy)
    //   //     }
    //   //   }
    //   // })

    //   spaContext.pageLoaded = true
    // }

    await spaContext.pageContentLoader({init: true})

    const onLoadPram = {
      // handlers: [
      //   // {
      //   //   get icon() {
      //   //     return mpaContext.showNavView ? '<' : '>'
      //   //   },
      //   //   position: 'left',
      //   //   style: {marginLeft: 'auto'},
      //   //   exe() {
      //   //     mpaContext.toggleNavView()
      //   //   }
      //   // },
      //   // {
      //   //   position: 'middle',
      //   //   get icon() {
      //   //     return mpaContext.viewNavs && mpaContext.viewNavs.map((view, idx) => {
      //   //       return {
      //   //         icon: view.title,
      //   //         get active() {
      //   //           return view.enable
      //   //         },
      //   //         // get disabled() {
      //   //         //   return !mpaContext.viewNavs.find(view => view.enable)
      //   //         // },
      //   //         exe: view.exe
      //   //       }
      //   //     })
      //   //   }
      //   // },
      //   // {
      //   //   get icon() {
      //   //     return mpaContext.showEditView ? '>' : '<'
      //   //   },
      //   //   position: 'right',
      //   //   style: {marginRight: 'auto'},
      //   //   exe() {
      //   //     mpaContext.toggleEditView()
      //   //   }
      //   // },
      //   {
      //     position: 'right',
      //     get icon() {
      //       return desnContext.isDebugMode() ? '设计' : '调试'
      //     },
      //     emphasized: true,
      //     exe() {
      //       if (desnContext.isDesnMode()) {
      //         desnContext.setModeDebug()
      //       } else {
      //         desnContext.setModeDesn()
      //       }
      //
      //       //desnContext.configs.navView?.toggleNavView(desnContext.isDesnMode())
      //     }
      //   }
      // ].map(hd => {
      //   Object.defineProperty(hd, 'disabled', {
      //     configurable: true,
      //     enumerable: true,
      //     get() {
      //       return spaContext.handlersDisabled
      //     }
      //   })
      //   return hd
      // }),
      async setComLibs(urlAry) {
        if (!Array.isArray(urlAry)) {
          throw new Error(`Invalid comlibAry.`)
        }
        const nlib = await loadComLibs(urlAry)

        nlib.push(mybricksCoreComLib)

        desnContext.comLibAry = nlib//init comlibs
      },
      switchActivity(name: string) {
        spaContext.activePlugin = desnContext.getPlugin(name)
      },
      dump(): { [p: string]: {} } {
        const pluginAry = desnContext.getPluginAry()
        if (pluginAry) {
          pluginAry.forEach(plugin => {
            if (typeof plugin.beforeDump === 'function') {
              plugin.beforeDump({
                data: desnContext.getPluginData(plugin.name)
              })
            }
          })
        }

        return spaContext.dump()
      },
      loadBlueprint(blueprintJSON: {}) {
        const c = loadView(blueprintJSON, true)
      },
      toJSON() {
        return toJSON(spaContext)
      },
      // dumpJSON(plugInNamespace: string) {
      //   return dumpJSON(spaContext, plugInNamespace)
      // },
      // toJSON() {
      //   return toJSON(spaContext)
      // },
      forEachCom(fn: Function) {
        forEachCom(fn, spaContext)
      },
      get geoView(): { canvasDom, addStyle, addCSSLink, width, height } {
        if (desnContext.configs.geoView) {
          return geoViewRef()
        }
      },
      getPluginData(pluginName) {
        return spaContext.desnContext.getPluginData(pluginName)
      },
      getAllComDef() {
        return desnContext.getAllComDef()
      },
      addComDef(def: T_XGraphComDef) {
        desnContext.addComDef(def)
      },
      console: {
        log: {
          get info() {
            return emitLogs.info
          },
          get warn() {
            return emitLogs.warn
          },
          get error() {
            return emitLogs.error
          }
        }
      },
      toggleNavView: (bool) => {
        spaContext.showNavView = bool
      },
      isDebugMode: desnContext.isDebugMode,
      pageContentLoader: spaContext.pageContentLoader
    }

    spaContext.ref(onLoadPram)
  }, [])
}

function initStageModel(spaContext: SPAContext) {
  const {desnContext, model} = spaContext

  useMemo(() => {
    if (spaContext.pageLoaded) {
      const loadBlank = () => {
        model.designerVersion = DesignerContext.DESIGNER_VERSION

        const factModule = {
          instId: MAIN_MODULE_ID,
          title: '主模块',
          slot: void 0,
          frame: void 0
        }

        let slotTitle

        const geoViewCfg = desnContext.configs.geoView
        if (geoViewCfg) {
          slotTitle = geoViewCfg.modules?.main?.title || '画布'

          factModule.slot = new GeoViewModel()
          factModule.slot.addModule({id: uuid(), title: slotTitle})

          //mainModule.slot.state.enable()
        }

        const toplViewCfg = desnContext.configs.toplView
        if (toplViewCfg) {
          factModule.frame = new ToplViewModel()

          const mainFrame = factModule.frame.addFrame({id: uuid(), title: slotTitle || '主程序'})

          const mainCardsCfg = toplViewCfg.cards?.main
          if (mainCardsCfg && !desnContext.isDesnModeOfBluePrint()) {//Not blueprint
            mainFrame.addIODiagram({title: mainCardsCfg.title})

            if (Array.isArray(mainCardsCfg.inputs)) {
              mainCardsCfg.inputs.forEach(input => {
                mainFrame.addInputPin({
                  id: input.id,
                  hostId: input.id,
                  title: input.title,
                  schema: input.schema
                })
              })
            }
            if (Array.isArray(mainCardsCfg.outputs)) {
              mainCardsCfg.outputs.forEach(output => {
                mainFrame.addOutputPin({
                  id: output.id,
                  hostId: output.id,
                  title: output.title,
                  schema: output.schema
                })
              })
            }
          }
        }

        if (spaContext.blueprint) {
          loadView(spaContext.blueprint.content as any)//Load blueprint first

          model.factModule = factModule

          const mainModule = model.mainModule

          const diagramAry = factModule.frame.frames[0].diagramAry
          if (diagramAry) {
            diagramAry.forEach(diagram => {
              mainModule.frame.frames[0].diagramAry.push(diagram)
            })
          }
        } else {
          model.mainModule = factModule
        }
      }

      if (spaContext.curPage?.content) {
        //const cloned = JSON.parse(JSON.stringify(page.content))////TODO

        if (spaContext.blueprint) {
          loadView(spaContext.blueprint.content as any)//Load blueprint first
        } else {
          loadView(spaContext.curPage.content as any)//Load current view
        }

        const mainModule = model.mainModule

        if (mainModule) {///兼容
          const geoViewCfg = desnContext.configs.geoView
          const toplViewCfg = desnContext.configs.toplView

          if (geoViewCfg) {
            const slot = mainModule.slot
            if (slot && slot.slots.length <= 0) {//兼容
              const mainSlot = slot.addModule({id: uuid(), title: '画布'}) as SlotModel
              const oStyle = slot.style
              if (oStyle) {
                for (let p in oStyle) {
                  mainSlot.style[p] = oStyle[p]
                }
              }

              mainSlot.comAry = slot.comAry

              const clearToplView = com => {
                if (!toplViewCfg) {
                  com.runtime.topl = void 0

                  if (com.slots) {
                    com.slots.forEach(slot => {
                      slot.comAry.forEach(ncom => {
                        clearToplView(ncom)
                      })
                    })
                  }
                }
              }

              mainSlot.comAry.forEach(com => {
                com.parent = mainSlot
                clearToplView(com)
              })
              slot.comAry = void 0
            }
          } else {
            if (mainModule.slot) {//remove it
              mainModule.slot = void 0
              delete mainModule.slot
            }
          }

          if (toplViewCfg) {
            //debugger

            const frame = mainModule.frame
            let mainFrame
            if (!frame || !frame.frames) {
              spaContext.emitMessage.error('数据格式存在异常.')
              spaContext.emitLogs.error('数据格式存在异常.')
              return
            }

            if (frame.frames.length <= 0) {//兼容
              mainFrame = frame.addFrame({id: uuid(), title: '画布'})

              mainFrame.frameAry = frame.frameAry || []

              if (mainFrame.frameAry) {
                mainFrame.frameAry.forEach(frame => {
                  frame.parent = mainFrame
                })
              }

              mainFrame.diagramAry = frame.diagramAry

              mainFrame.diagramAry.forEach(diagram => {
                diagram.parent = mainFrame
              })

              mainFrame.inputPins = frame.inputPins
              mainFrame.inputPins.forEach(pin => {
                pin.parent = mainFrame
              })

              mainFrame.outputPins = frame.outputPins
              mainFrame.outputPins.forEach(pin => {
                pin.parent = mainFrame
              })

              mainFrame.comAry = frame.comAry
              mainFrame.comAry.forEach(com => {
                com.parent = mainFrame
              })

              //mainFrame.conAry = frame.conAry

              frame.frameAry = void 0
              frame.diagramAry = void 0
              frame.inputPins = void 0
              frame.outputPins = void 0
              frame.comAry = void 0
              //frame.conAry = void 0
            } else {
              mainFrame = frame.frames[0]
            }

            // const mainCardsCfg = toplViewCfg.cards?.main
            // if (mainCardsCfg) {//兼容性校验
            //   // if (mainCardsCfg.title) {
            //   //   mainFrame.diagramAry[0].title = mainCardsCfg.title
            //   // }
            //   // if (Array.isArray(toplCfg.inputs)) {
            //   //   toplCfg.inputs.forEach(input => {
            //   //     if (!mainModule.frame.inputPins.find(pin => pin.hostId === input.id)) {
            //   //       mainModule.frame.addInputPin({
            //   //         id: input.id,
            //   //         hostId: input.id,
            //   //         title: input.title,
            //   //         schema: input.schema
            //   //       })
            //   //     }
            //   //   })
            //   // }
            // }


            //doFrame(mainFrame)
          } else {
            if (mainModule.frame) {//remove it
              mainModule.frame = void 0
              delete mainModule.frame
            }
          }

          if (spaContext.blueprint) {
            let factView
            try {
              factView = loadView(spaContext.curPage.content as any, true)//not merge
            } catch (ex) {
              console.error(ex)
              debugger
            }

            const mainGeoViewModel = mainModule.slot
            const mainSlot = mainGeoViewModel.slots[0]

            const mainToplViewModel = mainModule.frame as ToplViewModel
            const mainFrame = mainToplViewModel.frames[0]

            const factModule = factView[PERSIST_NAME].mainModule

            const factGeoViewModel = factModule.slot
            const factSlot = factGeoViewModel.slots[0] as SlotModel
            if (factSlot.comAry) {
              factSlot.comAry.forEach(com => {
                const cp = com.parent
                if (cp._type === 'blueprint') {
                  const bpCom = mainSlot.searchCom(cp.comId) as GeoComModel
                  if (bpCom) {
                    bpCom.getSlot(cp.slotId).addComponent(com)
                  } else {
                    mainSlot.addComponent(com)
                  }
                } else {
                  mainSlot.addComponent(com)
                }
              })
            }

            const factToplViewModel = factModule.frame as ToplViewModel
            const factFrame = factToplViewModel.frames[0] as FrameModel
            if (factFrame.comAry) {
              factFrame.comAry.forEach(com => {
                if (com) {
                  mainFrame.addComponent(com)///TODO
                }
              })
            }

            if (factFrame.diagramAry) {
              factFrame.diagramAry.forEach(diagram => {
                if (diagram) {
                  diagram.parent = mainFrame//change it's parent
                  mainFrame.diagramAry.push(diagram)
                }
              })
            }

            if (factToplViewModel.curDiagram) {
              mainToplViewModel.curDiagram = factToplViewModel.curDiagram
            }

            model.factModule = factModule
          }
        } else {
          spaContext.emitMessage.error('数据格式存在异常,视图内容丢失.')
          spaContext.emitLogs.error('数据格式存在异常,视图内容丢失.')
          loadBlank()

          //model.moduleNav = [model.mainModule]
        }
      } else {//blank
        if (model.mainModule === void 0) {
          loadBlank()
        }

        // if (model.moduleNav.length === 0) {
        //   model.moduleNav = [model.mainModule]
        // }
        //}

        Promise.resolve().then(() => {
          //Proxy
          desnContext.envVars.debug = {
            get envType() {
              return model.envVars.envType
            },
            set envType(val) {
              model.envVars.envType = val
            },
            get userToken() {
              return model.envVars.userToken
            },
            set userToken(val) {
              model.envVars.userToken = val
            },
            get envParams() {
              return model.envVars.envParams
            },
            set envParams(val) {
              model.envVars.envParams = val
            }
          } as any
        })

        //loadBlank(PERSIST_NAME, blankContent.current)
        //model.moduleNav = [model.mainModule]
      }

      keepWatch(() => {
        spaContext.loaded = true
      })

    }
  }, [spaContext.pageLoaded])
}

//
// function loadBlank(persistName, blankContent) {
//   const nblank = JSON.parse(JSON.stringify(blankContent))
//   const refs = nblank[persistName].refs
//   for (let key in refs) {
//     if (key.match(new RegExp(`^(${GeoViewModel.name}|${ToplViewModel.name})_`))) {
//       refs[key].id = uuid()//Replace id,so refresh component
//     }
//   }
//
//   loadView(nblank)
// }