/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * CheMingjun @2019
 * mybricks@126.com
 */
import React from 'react'

import {ComSeedModel, ErrorWrapper, NS_Emits} from '@sdk'

import {evt, load as loadView, observe, useComputed, useObservable} from '@mybricks/rxui'
import css from './SliderView.less'
import SPAContext from "../SPAContext";
import {T_Plugin} from "@mybricks/sdk";
import DesignerModel from "../DesignerModel";
import {createPortal} from "react-dom";
import {toJSON} from "../utils/toJSON";

class Ctx {
  spaContext: SPAContext

  model: DesignerModel

  emitItem: NS_Emits.Component

  viewEle: HTMLElement

  get activePlugin(): T_Plugin {
    return this.spaContext.activePlugin
  }

  switchPlugin(plugin) {
    if (this.spaContext.desnContext.isDebugMode()) {
      return
    }

    const spaContext = this.spaContext
    if (typeof plugin === 'object') {
      if (spaContext.activePlugin?.name === plugin.name) {
        spaContext.activePlugin = void 0
      } else {
        this.emitItem.blur()

        spaContext.activePlugin = plugin
      }
    } else {
      if (spaContext.activePlugin === plugin) {
        spaContext.activePlugin = void 0
      } else {
        spaContext.activePlugin = plugin
      }
    }
  }
}

let ctx: Ctx

export default function SliderView({style}) {
  const spaContext = observe(SPAContext, {from: 'parents'})
  const {model, desnContext, emitSnap} = spaContext
  const emitItem = useObservable(NS_Emits.Component, {expectTo: 'parents'})

  ctx = useObservable(Ctx, next => {
    // if (desnContext.configs.geoView) {
    //   spaContext.activePlugin = 'material'
    // }
    next({spaContext, model, emitItem})
  })

  const pluginsJSX = []
  const plugins = desnContext.configs?.plugins

  const isDebugMode = desnContext.isDebugMode()

  if (plugins && Array.isArray(plugins)) {
    plugins.forEach((plugin, idx) => {
      const tab = plugin?.contributes?.sliderView?.tab

      if (tab) {
        const icon = typeof tab.icon === 'object' ? tab.icon : tab.title
        const tips = !isDebugMode ? {'data-mybricks-tip': `{content:'${plugin.title}',position:'right'}`} : {}
        pluginsJSX.push(
          <div key={plugin.name}
               className={`${css.item} ${ctx.activePlugin?.name === plugin.name ? css.active : ''}`}
               onClick={evt(e => ctx.switchPlugin(plugin)).stop}
               {...tips}>{icon}</div>
        )
      }
    })
  }

  // useEffect(() => {
  //   const plugins = desnContext.configs?.plugins
  //   setTimeout(v => {
  //     ctx.switchPlugin(plugins[0])
  //   }, 1000)/////TODO
  // }, [])


  const navViewFromPlugin = useComputed(() => {
    const activePlugin: T_Plugin = ctx.activePlugin

    if (typeof activePlugin === 'object') {
      const contriTab = activePlugin?.contributes?.sliderView?.tab
      if (contriTab) {
        const viewRender = contriTab.render
        if (typeof viewRender === 'function') {
          const apiSet = contriTab.apiSet
          const params = {
            get data() {
              return ctx.spaContext.desnContext.getPluginData(activePlugin.name)
            },
            get pageStyle() {
              return {
                get background() {
                  const viewModel = ctx.model.mainModule.slot
                  return viewModel.slots[0].style.background
                  //return viewModel.style.background
                },
                set background(val) {
                  const viewModel = ctx.model.mainModule.slot
                  viewModel.slots[0].style.background = val//set main canvas
                  //viewModel.style.background = val
                }
              }
            }
          } as any
          if (Array.isArray(apiSet)) {
            if (apiSet.find(api => api === 'project')) {
              params.project = {
                loadContent(projectContent) {
                  if (projectContent?.content) {
                    loadView(projectContent.content as any)//Load current view
                  } else {
                    throw new Error(`数据错误`)
                  }
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
                toJSON() {
                  return toJSON(spaContext)
                },
              }
            }

            if (apiSet.find(api => api === 'component')) {
              params.component = {
                addDef(comDef) {
                  desnContext.addComDef(comDef)
                },
                addInstance(def) {
                  if (typeof def === 'object' && def.namespace && def.version) {
                    const comDef = desnContext.getComDef(def)
                    if (comDef) {
                      const seedModel = new ComSeedModel(comDef)

                      const snap = emitSnap.start('add component')

                      emitItem.add({seedModel, state: 'finish'})

                      snap.commit()
                    }
                  }
                }
              }
            }

            if (apiSet.find(api => api === 'theme')) {
              /////TODO
              params.theme = {
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
            } else if (apiSet.find(api => api === 'connector')) {
              params.connector = {
                add(con) {
                  spaContext.addConnector(con)
                }, update(con) {
                  spaContext.updateConnector(con)
                }, remove(id) {
                  spaContext.removeConnector(id)
                }, test(con, params) {
                  return spaContext.testConnector(con, params)
                }
              }
            }
          }

          return (
            <div className={css.pluginBg}
                 onClick={evt(e => ctx.switchPlugin(activePlugin)).stop}>
              <div className={css.activePlugin}
                   onClick={evt().stop}>
                <ErrorWrapper
                  render={() => {
                    return (
                      <div className={css.errPlugin}>
                        {activePlugin.title} 插件发生错误
                      </div>
                    )
                  }}>
                  {viewRender(params)}
                </ErrorWrapper>
              </div>
            </div>
          )
        }
      }
    }
  })

  const hasGeoView = desnContext.configs.geoView

  const styles = useComputed(() => {
    const mv = spaContext._maxView
    if (mv) {
      if (mv.options?.showEditView) {
        return {display: 'none'}
      } else {
        return {display: 'none'}
      }
    }

    if (desnContext.isDebugMode()) {
      return {display: 'none'}
    } else if (desnContext.isDesnMode()) {
      // const activePlugin: T_Plugin = desnContext.getActivePlugin()
      // const hideNavView = activePlugin?.contributes?.views?.activityBar?.tab?.active?.views?.nav?.visible === false
      // if (hideNavView) {
      //   rtn.nav = {display: 'none'}
      // }
    }

    if (spaContext.activePlugin) {
      return
    } else {
      return {display: 'none'}
    }

    if (!hasGeoView) {
      return {display: 'none'}
    }
  })

  if (!hasGeoView && !plugins) {
    return
  }

  return (
    <>
      <div className={css.view} style={style}
           ref={ele => {
             ele && (ctx.viewEle = ele)
           }}>
        {
          pluginsJSX
        }
        <div className={css.sper} style={{flex: 1}}>
        </div>
      </div>
      {
        navViewFromPlugin ? (
          createPortal(navViewFromPlugin, ctx.viewEle.parentElement)
        ) : null
      }
    </>
  )
}