/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * CheMingjun @2019
 * mybricks@126.com
 */
import {NS_Configurable} from "@sdk";
import SPAContext from "./SPAContext";

export function getConfigs(spaContext: SPAContext) {
  const {desnContext, model, config, emitItem, emitSnap} = spaContext

  let rtn = []

  const stageCfgs = config.editView?.items

  const editCtx = {
    // get diagram() {
    //   return {
    //     edit(pinId: string, pinTitle: string) {
    //       setTimeout(v => {
    //         emitItem.editGlobalDiagram(pinId, pinTitle)
    //       })
    //     }
    //   }
    // },
    get style() {
      const style = model.mainModule.slot.slots[0].style
      // const geoCfg = desnContext.configs.geoView
      // if(geoCfg.type==='custom'){
      //   if(!style.width){
      //     style.width = geoCfg.width
      //   }
      //   if(!style.width){
      //     style.width = geoCfg.width
      //   }
      // }
      return style
    },
    isDesnMode() {
      return desnContext.isDesnMode()
    },
    isDesnModeofBluePrint() {
      return desnContext.isDesnModeOfBluePrint()
    },
    isDesnModeAsNormal() {
      return desnContext.isDesnModeOfNormal()
    },
    editAsBluePrint() {
      //if (desnContext.configs.useBluePrint) {
      desnContext.setModeDesnOfBluePrint()
      // } else {
      //   throw new Error(`BluePrint not supportted`)
      // }
    },
    editAsNormal() {
      desnContext.setModeDesnOfNormal()
    }
  }

  function initCatelog(cate, items) {
    if (Array.isArray(items)) {
      items.forEach((item, idx) => {
        if (item.items) {//Real group
          const bgGroup = new NS_Configurable.Group(item.title);
          cate.addGroup(bgGroup);

          item.items.forEach(item => {
            bgGroup.addItem(createEdtItem(spaContext, {
              title: item.title,
              type: item.type,
              options: item.options,
              description: item.description,
              // ifVisible,有该方法则执行,否则默认true
              ifVisible() {
                if (item.ifVisible) {
                  return item.ifVisible(editCtx)
                }
                return true
              },
              value: {
                get() {
                  return item.value.get(editCtx)
                },
                set(val) {
                  if (typeof item.value.set === 'function') {
                    item.value.set(editCtx, val)
                  }
                }
              }
            }))
          })
        } else {//Edit item
          const bgGroup = new NS_Configurable.Group();
          cate.addGroup(bgGroup);

          if (typeof item === 'function') {
            //bgGroup.addItem(createEdtItem(spaContext, item))
            bgGroup.addItem(item)
          } else if (typeof item === 'object') {
            bgGroup.addItem(createEdtItem(spaContext, {
              title: item.title,
              type: item.type,
              options: item.options,
              description: item.description,
              ifVisible() {
                if (item.ifVisible) {
                  return item.ifVisible(editCtx)
                }
                return true
              },
              value: {
                get() {
                  return item.value.get(editCtx)
                },
                set(val) {
                  if (typeof item.value.set === 'function') {
                    item.value.set(editCtx, val)
                  }
                }
              }
            }))
          }

        }
      })
    }
  }

  if (typeof stageCfgs === 'function') {
    const cate0 = {title: '项目', items: []}, cate1 = {title: '', items: []}, cate2 = {title: '', items: []}

    stageCfgs({}, cate0, cate1, cate2)

    const cate = new NS_Configurable.Category(cate0.title || '项目')
    rtn.push(cate)

    initCatelog(cate, cate0.items || [])

    if (cate1.items?.length > 0) {
      const cate = new NS_Configurable.Category(cate1.title || '')
      rtn.push(cate)

      initCatelog(cate, cate1.items)
    }

    if (cate2.items?.length > 0) {
      const cate = new NS_Configurable.Category(cate2.title || '')
      rtn.push(cate)

      initCatelog(cate, cate2.items)
    }
  } else {
    let cate = new NS_Configurable.Category('项目')
    rtn.push(cate)

    initCatelog(cate, stageCfgs)
  }

  //---------------------------------------------------------------------------------------------

  // const envGroup = new NS_Configurable.Group('调试')
  // comCategary.addGroup(envGroup)

  // if (ctxCfgs.debug && Array.isArray(ctxCfgs.debug.envTypes)) {
  //   envGroup.addItem(createEdtItem(svContext, {
  //     title: `环境类型`,
  //     type: 'select',
  //     options: ctxCfgs.debug.envTypes.map(({id, title}) => ({value: id, label: title})),
  //     value: {
  //       get() {
  //         return context.envVars.debug.envType
  //       },
  //       set(val) {
  //         context.envVars.debug.envType = val
  //       }
  //     }
  //   }))
  // }

  // envGroup.addItem(createEdtItem(svContext, {
  //   title: `用户Token`,
  //   type: 'text',
  //   value: {
  //     get() {
  //       return context.envVars.debug.userToken
  //     },
  //     set(val) {
  //       context.envVars.debug.userToken = val
  //     }
  //   }
  // }))

  // envGroup.addItem(createEdtItem(svContext, {
  //   title: `环境参数`,
  //   type: 'textarea',
  //   value: {
  //     get() {
  //       return context.envVars.debug.envParams
  //     },
  //     set(val) {
  //       context.envVars.debug.envParams = val
  //     }
  //   }
  // }))

  return rtn
}

function createEdtItem(spaContext: SPAContext, editor) {
  const {model, emitSnap} = spaContext
  const edtContext = {}
  if (typeof editor === 'function') {
    return new NS_Configurable.FunctionItem(function () {
      editor(edtContext)
    })
  } else if (typeof editor === 'object') {
    let options = editor.options
    if (typeof options === 'function') {
      options = editor.options(edtContext)
    }

    return new NS_Configurable.EditItem({
      title: editor.title,
      type: editor.type,
      description: editor.description,
      // ifVisible功能缺失
      ifVisible: editor.ifVisible,
      value: (function () {
        let initVal, wartForComplete = false;//Prevent for invoke value.get many times before onComplete invoked
        return {
          get() {
            if (!wartForComplete) {
              wartForComplete = true;
              initVal = (editor.value && editor.value.get || (() => undefined))()
              initVal = initVal == undefined ? null : initVal;
            }
            return initVal;
          }, set(v) {
            wartForComplete = false;
            const snap = emitSnap.start('Change value');
            try {
              (editor.value && editor.value.set || (() => undefined))(v)
              snap.commit()
            } catch (ex) {
              throw ex;
            }
          }
        }
      })(), options
    } as any)
  } else {
    throw new Error(`Invalid typeof editor(function or object expect)`)
  }
}