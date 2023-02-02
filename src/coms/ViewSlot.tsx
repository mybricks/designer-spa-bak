import React, {Fragment, useCallback, useEffect, useMemo} from 'react'

import {getPosition} from '@utils'
import SPAContext from '../SPAContext'
import ViewSlotModel from '../ViewSlotModel'
import {observe, useObservable, dragable, useComputed} from '@mybricks/rxui'

import css from './ViewSlot.less'
import {ICONS} from "../constants";

class Ctx {
  spaContext: SPAContext
  model: ViewSlotModel
  visible: boolean = true
  ele?: HTMLElement
  toolbarExt: () => JSX.Element

  //status: 'normal' | 'min' = 'normal'
}

const MIN_HEIGHT = 30

export default function ViewSlot({id, style, inIFrame, focused, min, onClose, ifVisible}) {
  const spaContext = observe(SPAContext, {from: 'parents'})

  const ctx = useObservable(Ctx, next => {
    const model = spaContext.model.viewSlots[id]
    if (model) {
      next({
        spaContext,
        model,
        //status: min ? 'min' : 'normal'
      })
    } else {
      const view = spaContext.model.views[id]
      next({
        spaContext,
        model: new ViewSlotModel({
          status: view.status,
          closeable: false,
          tabs: [id],
          showTitleBar: true,
          height: view.height
        })
        //, status: min ? 'min' : 'normal'
      })
    }
  })

  const model = ctx.model as ViewSlotModel

  useEffect(() => {
    const {model, ele} = observe(Ctx)

    if (typeof model.height === 'number' && model.height > MIN_HEIGHT) {
      model.status = 'normal'
    }

    const fh = ele?.parentElement?.offsetHeight
    if (model.height > fh - 5) {//防止调整窗口后溢出
      model.height = fh + 1
    }

  }, [])

  const tabsTitle = useComputed(() => {
    return model.tabs.map((viewId, idx) => {
      const view = spaContext.model.views[viewId]
      return view ? view.title : 'Loading'
    }).filter(v => v)
  })

  const iconClick = useCallback((type) => {
    return () => {
      switch (type) {
        case 'min': {
          model.status = 'min'
          if (model.height === void 0 || model.height > MIN_HEIGHT) {
            model.heightRecover = model.height
            model.height = MIN_HEIGHT
          }
          break
        }
        case 'recover': {
          model.status = 'normal'
          model.height = model.heightRecover || 400
          break
        }
        case 'close': {
          onClose()
          break
        }
      }
    }
  }, [])

  useComputed(() => {
    if (typeof ifVisible === 'function') {
      if (ifVisible()) {
        ctx.visible = true
        //setTimeout(iconClick('min'))
      } else {
        ctx.visible = false
        //setTimeout(iconClick('recover'))
      }
    }
  })

  const tabsTitleAction = useComputed(() => {
    let btnJSX
    if (model.closeable || model.isStatusOfMax() || model.isStatusOfPop()) {
      btnJSX = <div onClick={iconClick('close')} className={`${css.icon} ${css.iconRecover}`}>
        {ICONS.close}
      </div>
    } else if (model.height !== 'auto') {
      if (model.status === 'min') {
        btnJSX = <div onClick={iconClick('recover')} className={`${css.icon} ${css.iconRecover}`}>
          {ICONS.recover}
        </div>
      } else {
        if (model.height > MIN_HEIGHT || !model.height) {
          //model.status = 'normal'
          btnJSX = <div onClick={iconClick('min')} className={css.icon}>
            {ICONS.min}
          </div>
        } else {
          //model.status = 'min'
          btnJSX = <div onClick={iconClick('recover')} className={`${css.icon} ${css.iconRecover}`}>
            {ICONS.recover}
          </div>
        }
      }
    }

    return btnJSX
  })

  const tabsContent = useComputed(() => {
    return model.tabs.map((viewId, idx) => {
      const view = spaContext.model.views[viewId]
      return view ? (
        <Fragment key={idx}>
          <view.render onToolbar={render => {
            if (typeof render === 'function') {
              ctx.toolbarExt = render
            }
          }}/>
        </Fragment>
      ) : null
    })
  })

  const classes = useComputed(() => {
    const rtn = [css.view]
    if (model.status) {
      rtn.push(css[model.status])
    }
    if (spaContext.reLayout) {
      rtn.push(css.freeze)
    }
    return rtn.join(' ')
  })

  const myStyle = useComputed(() => {
    const rtn: any = !ctx.visible ? {display: 'none'} : {}

    if (model.height === 'auto' || model.height === void 0) {
      rtn.overflow = 'auto'
      rtn.flex = 1
    } else {
      if (model.status === 'min') {
        rtn.height = MIN_HEIGHT - 1
      } else {
        if (model.isStatusOfMax() || model.isStatusOfPop()) {
          rtn.height = '100%'
        } else {
          rtn.height = model.height || 400
        }
      }
    }

    //style={{pointerEvents:spaContext.reLayout?'none':''}}

    return Object.assign(rtn, style || {})
  })

  useComputed(() => {
    if (onClose && spaContext.desnContext.isDebugMode()) {
      onClose()
    }
  })

  // const openDialog = useComputed(() => {
  //   if (focused && spaContext._dialog) {
  //     return (
  //       <div className={css.dialogContainer}>
  //         {spaContext._dialog.content()}
  //       </div>
  //     )
  //   }
  // })

  const toolbarExt = useComputed(() => {
    if (ctx.toolbarExt) {
      return ctx.toolbarExt()
    }
  })


  return (
    <>
      {
        model.height !== 'auto' ? (
          <div className={css.sperH} style={!ctx.visible ? {display: 'none'} : {}}
            // onMouseEnter={e=>{ctx.spaContext.reLayout = true}}
            // onMouseLeave={e=>{ctx.spaContext.reLayout = void 0}}
               onMouseDown={resizeView}>
            <div></div>
          </div>
        ) : null
      }
      <div className={classes} style={myStyle}
           ref={ele => ele && (ctx.ele = ele)}>
        {
          model.showTitleBar ? (
            <>
              <div className={css.title}>
                {
                  tabsTitle.length > 0 ? (
                    <div className={css.tt} onDoubleClick={maxView}>{tabsTitle}</div>
                  ) : null
                }
                <div className={css.ext}
                     style={{visibility: model.status === 'min' ? 'hidden' : 'visible'}}>{toolbarExt}</div>
                {tabsTitleAction}
                {/* <span className={css.clearIcon} onClick={clearCon}/> */}
                {/* <span className={css.closeIcon} onClick={closeCon}/> */}
              </div>
              <div className={css.content}>
                {tabsContent}
                {/*{openDialog}*/}
              </div>
            </>
          ) : tabsContent
        }
      </div>
    </>
  )
}

function maxView(evt) {
  const {model, ele} = observe(Ctx)
  const fh = ele?.parentElement?.offsetHeight
  if (model.height >= fh) {
    model.height = model.heightRecover
  } else {
    model.height = fh + 1
  }
}

function resizeView(evt) {
  const ctx = observe(Ctx)
  const {model, spaContext} = ctx

  let oh, fh

  dragable(evt, ({po: {x, y}, epo: {ex, ey}, dpo: {dx, dy}}, state) => {
    if (state == 'start') {
      let {x, y, w, h} = getPosition(ctx.ele);

      oh = h + evt.clientY
      fh = ctx.ele?.parentElement?.offsetHeight

      requestAnimationFrame(() => {
        spaContext.reLayout = true
      })
    }
    if (state == 'moving') {
      model.status = 'normal'

      if (dy > 0) {
        if (model.height <= MIN_HEIGHT + 10) {
          model.height = MIN_HEIGHT - 1
          model.status = 'min'
          return
        }
      }
      if (dy < 0) {
        if (model.height >= fh - 10) {
          model.height = fh + 1
          return
        }
      }

      requestAnimationFrame(() => {
        model.height = oh - ey
      })

      //ctx.onResize()
    }
    if (state == 'finish') {
      requestAnimationFrame(() => {
        //if (ctx.spaContext) {
        spaContext.reLayout = void 0
        //}
      })
    }
  })
}

// function closeCon() {
//   const ctx = observe(Ctx)
//   ctx.openConsole = false
//   clearLogs()
// }

// function clearCon() {
//   const ctx = observe(Ctx)
//   ctx.openConsole = true
//   clearLogs()
// }

// function clearLogs() {
//   const ctx = observe(Ctx)
//   ctx.logs = []
// }
