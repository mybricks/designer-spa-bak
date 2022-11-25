import {ComRuntimeModel, DesignerContext, NS_Emits} from "@sdk";
import {T_Page, T_Service} from "./types";
import {PERSIST_NAME} from "./constants";

import {dump as dumpPage} from "@mybricks/rxui";
import DesignerModel from "./DesignerModel";
import {T_Plugin} from "@mybricks/sdk";
import ConnectorModel from "./ConnectorModel";
import {FrameModel} from "@mybricks/desn-topl-view";
import {GeoComModel, SlotModel} from "@mybricks/desn-geo-view";

export default class SPAContext {
  model: DesignerModel

  config: { pageContentLoader, editView }

  onMessage

  ref

  onEdit

  onClick

  //-----------------------------------------------------------------

  reLayout: boolean

  ele: HTMLElement

  pageLoaded: boolean

  loadingMsg: string

  loaded: boolean

  //-----------------------------------------------------------------

  desnContext: DesignerContext

  pageContentLoader

  //pageAry: T_Page[]

  blueprint: T_Page

  curPage: T_Page

  serviceAry: T_Service

  curDebugParams: {}

  //viewNavs: { name: string, title: string, enable: boolean, exe: () => any }[]

  activePlugin: T_Plugin

  showNavView: boolean = true

  showEditView: boolean = true

  handlersDisabled: boolean = false

  listeners

  getTheme(varName) {
    return this.model.themes[varName]
  }

  //-----------------------------------------------------------------------

  emitLogs: NS_Emits.Logs

  emitSnap: NS_Emits.Snap

  emitItem: NS_Emits.Component

  emitMessage: NS_Emits.Message

  //focusViewSlotModel: ViewSlotModel

  _maxView: { title, content: Function, options: { showEditView, onClose } }

  _popView: { title, content: Function, options: { width: number, beforeEditView: boolean, onClose: Function } }

  eventLogs: { time: Date, type: 'info' | 'warn' | 'error', msg: string }[] = []

  // toggleNavView(show) {
  //   debugger
  //
  //
  //   this.showNavView = typeof show === 'boolean' ? show : !this.showNavView
  // }
  //
  // toggleEditView() {
  //   this.showEditView = !this.showEditView
  // }

  popView(title: string, content: Function, options?) {
    this._popView = {title, content, options}
  }

  maxView(title: string, content: Function, options?) {
    this._maxView = {title, content, options}
  }

  // openInCurViewSlot(title: string, content: Function) {
  //   this._dialog = {title, content}
  // }
  //
  // closeInCurViewSlot() {
  //   this._dialog = void 0
  // }

  // loadComLib(lib: T_XGraphComLib) {
  //   if (lib.dependencies && Array.isArray(lib.dependencies)) {
  //     lib.dependencies.forEach(dep => {
  //       if (typeof dep === 'object') {
  //         const {name, js, css} = dep
  //         if (css && Array.isArray(css)) {
  //           require(css, () => {
  //             this.emitLogs.info(`加载组件库${lib.title}:${lib.version}的css依赖内容完成`)
  //           })
  //         }
  //         if (js && Array.isArray(js)) {
  //           require(js, () => {
  //             this.emitLogs.info(`加载组件库${lib.title}:${lib.version}的js依赖内容完成`)
  //           })
  //         }
  //       }
  //     })
  //   }
  // }

  // addPage(page: T_Page) {
  //   this.pageAry.push(page)
  // }

  // searchPage(pageId: string): T_Page {
  //   let rtnPage
  //   const fn = (parentPage?) => {
  //     if (parentPage && parentPage.id === pageId) {
  //       return rtnPage = parentPage
  //     }
  //     const chd = parentPage ? parentPage.children : this.pageAry
  //     if (chd.length > 0) {
  //       return chd.find(pg => {
  //         if (pg.id === pageId) {
  //           return rtnPage = pg
  //         } else {
  //           return fn(pg)
  //         }
  //       }) as T_Page
  //     }
  //   }
  //
  //   this.pageAry.find(fn)
  //
  //   return rtnPage
  // }

  setCurPage(curPage: T_Page) {
    this.curPage = curPage
  }

  getCurPage() {
    return this.curPage
  }

  // openPage(page, debugParams?): boolean {
  //   let npage
  //   if (typeof page === 'object' && page) {
  //     npage = page
  //   } else if (typeof page === 'string') {
  //     if (this.curPage.id === page) {
  //       return
  //     }
  //     npage = this.pageAry.find(pg => pg.id === page)
  //   }
  //
  //   if (npage) {
  //     this.curPage = npage
  //     this.curDebugParams = debugParams
  //
  //     return true
  //   }
  //   return false
  // }

  // removePage(pageId: string): boolean {
  //   const page = this.searchPage(pageId)
  //   if (page) {
  //     if (page.parentId) {
  //       const ppage = this.searchPage(page.parentId)
  //       const idx = ppage.children.indexOf(page)
  //       ppage.children.splice(idx, 1)
  //     } else {
  //       const idx = this.pageAry.indexOf(page)
  //       this.pageAry.splice(idx, 1)
  //     }
  //     this.curPage = void 0
  //     return true
  //   }

  //
  //
  // let idx
  // this.pageAry.find((page, i) => {
  //   if (page.id === pageId) {
  //     idx = i
  //     return true
  //   }
  // })
  // if (idx !== void 0) {
  //   this.pageAry.splice(idx, 1)
  //   if (this.pageAry.length > 0) {
  //     if (idx < this.pageAry.length) {
  //       pageClick(this.pageAry[idx])
  //     } else {
  //       pageClick(this.pageAry[idx - 1])
  //     }
  //   }
  // }
  //}

  addConnector(opts: { id, type, title, paramAry, inputSchema, outputSchema, script }) {
    const conModel = new ConnectorModel(opts)
    this.model.addConnector(conModel)
  }

  updateConnector(opts: { id, title, paramAry, inputSchema, outputSchema, script }) {
    const conModel = this.model.searchConnector(opts.id)
    if (conModel) {
      for (const key in opts) {
        conModel[key] = opts[key]
      }

      conModel.lastModifiedTime = new Date().getTime()

      this.emitItem.notifyConnectorUpdated(conModel)
    }
  }

  removeConnector(id: string) {
    const conModel = this.model.searchConnector(id)
    if (conModel) {
      this.model.removeConnector(id)

      this.emitItem.notifyConnectorRemoved(conModel)
    }
  }

  testConnector(connector: ConnectorModel, params?: {}) {
    const callConnector = this.desnContext.configs.com?.env?.callConnector
    if (typeof callConnector === 'function') {
      return callConnector(connector, params)
    } else {
      throw new Error(`configs.com.env.callConnector not found`)
    }
    //
    //
    // return new Promise((resolve, reject) => {
    //   if (typeof script === 'string') {
    //     try {
    //       eval(`(${script})`)(params, {
    //         then(data) {
    //           resolve(data)
    //         }, onError(err) {
    //           reject(err)
    //         }
    //       }, {
    //         ajax(opts) {
    //           let url = opts.url
    //           let headers
    //           let body
    //
    //           if (opts.method.toUpperCase() === 'GET') {
    //             if (params) {
    //               let arr = []
    //               for (let objKey in params) {
    //                 arr.push(objKey + "=" + params[objKey]);
    //               }
    //               url += `?${arr.join("&")}`
    //             }
    //           } else if (opts.method.toUpperCase() === 'POST') {
    //             if (params) {
    //               body = JSON.stringify(params)
    //               //headers = {'Content-Type': 'x-www-form-urlencoded;charset=UTF-8'}
    //               headers = {'Content-Type': 'application/json'}
    //             }
    //           }
    //
    //           return new Promise((resolve1, reject1) => {
    //             window.fetch(url, {method: opts.method, body, headers})
    //               .then(response => {
    //                 if (String(response.status).match(/^2\d{2}$/g)) {
    //                   if (response && typeof response.json === 'function') {
    //                     try {
    //                       return response.json()
    //                     } catch (ex) {
    //                       reject1(ex.message)
    //                     }
    //                   } else {
    //                     resolve1('')
    //                   }
    //                 } else {
    //                   reject1(`服务连接错误（状态码 ${response.status}）`)
    //                 }
    //               })
    //               .then(data => {
    //                 resolve1(data)
    //               })
    //               .catch(err => {
    //                 reject1(err.message)
    //               })
    //           })
    //         }
    //       })
    //     } catch (ex) {
    //       console.error(ex)
    //       reject(ex)
    //     }
    //   } else {
    //     reject(new Error(`Invalid code`))
    //   }
    // })
  }

  callConnector(opts: { id: string, params: {} }): Promise<any> {
    if (typeof opts === 'object' && opts) {
      const {id, params} = opts
      const conModel = this.model.searchConnector(id)
      if (conModel) {
        return this.testConnector(conModel.script, params)
      }
    }
  }

  dump(uncompressed?) {
    const factModule = this.model.factModule

    if (factModule) {//with blueprint
      const dumped = dumpPage(this.model.mainModule,
        {
          uncompressed: true,
          map(target, prop, val) {
            if(target instanceof SlotModel){
              debugger /////TODO 增加过滤条件
            }

            if (target instanceof ComRuntimeModel && target.isBluePrint) {
              return
            }

            if (target.runtime instanceof ComRuntimeModel && target.runtime.isBluePrint) {
              return
            }



            return val
          }
        }
      )


      // const mainSlot = factModule.slot.slots[0] as SlotModel
      // if (mainSlot.comAry) {
      //   mainSlot.comAry.forEach(com => {
      //     com.parent = mainSlot//reback
      //   })
      // }
      //
      //
      //
      //
      //
      //
      //
      //
      // const mainFrame = factModule.frame.frames[0] as FrameModel
      // if (mainFrame.comAry) {
      //   mainFrame.comAry.forEach(com => {
      //     com.parent = mainFrame//reback
      //   })
      // }
      //
      // const dumped = dumpPage({mainModule:factModule}, uncompressed)

      console.log(JSON.stringify(dumped))

      throw new Error('test')

      return {
        content: {
          [PERSIST_NAME]: dumped
        }
      } as T_Page
    } else {
      this.curPage.content = {[PERSIST_NAME]: dumpPage(PERSIST_NAME, uncompressed)}

      return this.curPage
    }

    // const fn = page => {
    //   return {
    //     id: page.id,
    //     type: page.type,
    //     parentId: page.parentId,
    //     title: page.title,
    //     isActive: page.isActive,
    //     props: page.props,
    //     content: page.content,
    //     children: page.children ? page.children.map(pg => fn(pg)) : []
    //   }
    // }
    //
    // return {
    //   focusPageId: this.curPage.id,
    //   pageAry: this.pageAry.map(page => fn(page))
    // }
  }
}
