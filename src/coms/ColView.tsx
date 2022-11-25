import css from "./ColView.less";
import React, {useEffect, useMemo} from "react";
import {dragable, observe, useObservable} from "@mybricks/rxui";
import SPAContext from "../SPAContext";

class Ctx {
  width: number
  resizer: 'left' | 'right'
  spaContext: SPAContext
  onResize: (width) => void
}

export default function ColView({style, width, resizer, children, onResize}) {
  const spaContext = observe(SPAContext, {from: 'parents'})
  const ctx = useObservable(Ctx, next => next({width, resizer, spaContext, onResize}), [width])

  useEffect(() => {
    if (typeof onResize === 'function') {
      onResize(width)
    }
  }, [])

  return (
    <>
      {
        resizer === 'left' ? (
          <div className={css.resizer} style={{...style}} onMouseDown={e => resizeView(e, ctx)}>
            <div/>
          </div>
        ) : null
      }
      <div className={css.view} style={{...style, width: ctx.width}}>
        {children}
      </div>
      {
        resizer === 'right' ? (
          <div className={css.resizer} style={{...style}} onMouseDown={e => resizeView(e, ctx)}>
            <div/>
          </div>
        ) : null
      }
    </>
  )
}

function resizeView(evt, ctx: Ctx) {
  requestAnimationFrame(() => {
    ctx.spaContext.reLayout = true
  })
  const leftF = ctx.resizer === 'left'
  let owidth = ctx.width
  dragable(evt, ({po: {x, y}, epo: {ex, ey}, dpo: {dx, dy}}, state) => {
    if (state == 'moving') {
      //requestAnimationFrame(() => {
      owidth = owidth + (leftF ? -dx : +dx)
      if (owidth > 220) {
        ctx.width = owidth
      }
      //})

      //ctx.onResize()
    }
    if (state == 'finish') {
      ctx.spaContext.reLayout = void 0
      if (ctx.onResize) {
        ctx.onResize(ctx.width)
      }
    }
  })
}
