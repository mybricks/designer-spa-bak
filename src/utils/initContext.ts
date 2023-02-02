import SPAContext from "../SPAContext";
import {DesignerContext, NS_Emits} from "@sdk";

import {implement, stopWatch, takeSnap, useObservable} from "@mybricks/rxui";
import {T_Page} from "../types";

export default function initContext(desnContext: DesignerContext, {
  config,
  onMessage,
  onEdit,
  onClick,
  ref
}): SPAContext {
  let spaContext: SPAContext

  const emitMessage = implement(NS_Emits.Message,
    next => ({
      info(message) {
        if (onMessage) {
          onMessage('info', message)
        }
      },
      warn(message) {
        if (onMessage) {
          onMessage('warn', message)
        }
      },
      error(message) {
        if (onMessage) {
          onMessage('error', message)
        }
      },
      trace(message) {
        if (onMessage) {
          onMessage('trace', message)
        }
      }
    }),
    {from: 'children'})

  const emitSnap = implement(NS_Emits.Snap, () => ({
    start(title) {
      const snap = takeSnap(title || 'todo', (obj, prop, val) => {
        // console.log('==>obj:', obj)
        // console.log('==>prop:', prop)
        // console.log('==>val:', val)
        // console.log('\n')
      })
      // TODO
      // throw callback for App
      return {
        wait() {
          snap.wait()
        }, commit(opt) {
          let canced
          if (onEdit) {
            canced = onEdit({
              title
            })
          }
          if (typeof canced === 'boolean' && canced === false) {
            snap.cancel()
          } else {
            snap.commit(opt)
          }
        }, cancel() {
          snap.cancel()
          emitLogs.warn('操作回滚', `操作回滚到${name || 'todo'}之前.`)
        }
      }
    }
  }), {from: 'children'})

  const emitItem = useObservable(NS_Emits.Component, {expectTo: 'children'})
  const emitIOCAbout = useObservable(NS_Emits.IOCAbout, {expectTo: 'children'})
  const emitLogs = implement(NS_Emits.Logs, next => next({
    info(msg) {
      requestAnimationFrame(v => {
        stopWatch(() => {
          spaContext.eventLogs.push({time: new Date(), type: 'info', msg})
        })
      })
      // console.warn(`Not implement for NS_Emits.Logs.error`)
      // console.log(msg)
    },
    warn(msg) {
      requestAnimationFrame(v => {
        stopWatch(() => {
          spaContext.eventLogs.push({time: new Date(), type: 'warn', msg})
        })
      })
    },
    error(msg) {
      requestAnimationFrame(v => {
        stopWatch(() => {
          spaContext.eventLogs.push({time: new Date(), type: 'error', msg})
        })
      })
    }
  }), {from: 'children', expectTo: 'children'})

  //const emitPage = observe(NS_Emits.Page, {from: 'children', expectTo: 'children'})

  // const emitPage = observe(NS_Emits.Page, next => {
  //   next({
  //     getPageTree(all?) {
  //       const pageAry = mpaContext.pageAry
  //
  //       const fn = page => {
  //         if (all || page.type !== 'dialog') {
  //           return {
  //             id: page.id,
  //             type: page.type,
  //             get title() {
  //               return page.title
  //               // if (page.type === 'dialog') {
  //               //   return <span style={{color: "#c1a049"}}>{page.title}</span>
  //               // } else {
  //               //   return page.title
  //               // }
  //             },
  //             isActive: page.isActive,
  //             props: page.props,
  //             //content: page.content,
  //             children: page.children?.map(pg => fn(pg)).filter(p => p)
  //           }
  //         }
  //       }
  //
  //       return {id: ':root', title: '全部页面', children: pageAry.map(fn).filter(p => p)}
  //     },
  //     getCurPage() {
  //       const curPage = mpaContext.getCurPage()
  //       return {id: curPage.id, title: curPage.title}
  //     },
  //     delete(pageId) {
  //       mpaContext.removePage(pageId)
  //     }
  //   })
  // }, {from: 'children', expectTo: 'children'})


  async function pageContentLoader(props = {}, tptJson) {
    const {init, internalUpdate} = props

    spaContext.loaded = false
    spaContext.pageLoaded = false

    // spaContext.loadingMsg = '加载组件库...'
    // if (!init) {
    //   const libAry = await desnContext.configs.comlibLoader()
    //   if (!Array.isArray(libAry)) {
    //     throw new Error(`Invalid comlibAry.`)
    //   }
    //
    //   const nlib = []//clone
    //   libAry.forEach(lib=>{
    //     nlib.push(lib)
    //   })
    //
    //   nlib.push(xgComLib)
    //
    //   desnContext.comLibAry = nlib
    // }

    // spaContext.loadingMsg = '加载页面...'

    if (spaContext.config.pageContentLoader) {
      let loadedContent: { title, content } = await spaContext.config.pageContentLoader()

      let projectData, tptData
      if (Array.isArray(loadedContent)) {
        projectData = loadedContent[0]
        if (loadedContent.length > 1) {
          spaContext.blueprint = loadedContent[1]
        }
      } else if (typeof loadedContent === 'object') {
        projectData = loadedContent
      }

      if (!projectData) {
        projectData = {
          title: '首页'
        }
      }

      // if (spaContext.curPage && internalUpdate) {////TODO Test
      //   Object.assign(projectData, spaContext.dump())
      // }

      spaContext.curPage = projectData as T_Page

      const curPage = spaContext.curPage
      spaContext.setCurPage(curPage)
    }

    //keepWatch(()=>{
    spaContext.pageLoaded = true
    //spaContext.loaded = true
    //})
  }


  spaContext = useObservable(SPAContext, next => next({
    desnContext,
    config,
    ref,
    pageContentLoader,
    onMessage,
    onEdit,
    onClick,
    emitLogs,
    emitSnap,
    emitItem,
    emitIOCAbout,
    emitMessage,
    // pageLoader: config.pageLoader,
  }), {to: "children"})

  return spaContext
}

