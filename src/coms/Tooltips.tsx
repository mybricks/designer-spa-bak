import {observe, useComputed, useObservable} from "@mybricks/rxui";
import {getPosition} from "@utils";
import {createPortal} from "react-dom";
import React, {useEffect} from "react";
import SPAContext from "../SPAContext";

import css from './Tooltips.less'

class ToolTipCtx {
  ele?: any
  show: boolean = false
  description: string = ''
}

let toolTipCtx: ToolTipCtx

export default function Tooltips() {
  const spaCtx = observe(SPAContext, {from: 'parents'})

  toolTipCtx = useObservable(ToolTipCtx, next => {
    next({
      ele: null,
      show: false,
      description: ''
    })
  })

  useEffect(() => {
    //let delay = 0

    const findTip = dom => {
      if (!dom.dataset['mybricksTip']) {
        let c = 0
        let now = dom.parentNode
        while (now && c++ < 5) {
          if (now.dataset?.['mybricksTip']) {
            return now
          }
          now = now.parentNode
        }
      } else {
        return dom
      }
    }

    const mouseover = e => {
      const dom = e.target as HTMLElement
      if (dom) {
        const ele = findTip(dom)
        if (ele) {
          toolTipCtx.ele = ele
          toolTipCtx.description = ele.dataset['mybricksTip']
          toolTipCtx.show = true

          ele.addEventListener('mouseout', mouseout)
        }
      }
    }

    const mouseout = e => {
      const dom = e.target as HTMLElement

      toolTipCtx.ele = void 0
      toolTipCtx.show = false

      dom.removeEventListener('mouseout', mouseout)
    }

    const click = e => {
      const dom = e.target as HTMLElement

      toolTipCtx.ele = void 0
      toolTipCtx.show = false

      dom.removeEventListener('click', click)
    }

    spaCtx.ele.addEventListener('mouseover', mouseover, false)
    spaCtx.ele.addEventListener('click', click, false)
    //spaCtx.ele.addEventListener('mouseout', mouseout, false)

  }, [])

  if (toolTipCtx.show && toolTipCtx.ele) {
    const po = getPosition(toolTipCtx.ele)
    let descObj
    let desc = toolTipCtx.description
    if (desc.startsWith('{')) {
      try {
        eval(`descObj = ${toolTipCtx.description}`)
      } catch (ex) {
        descObj = {content: `提示内容错误`, position: 'default'}
      }
    } else {
      descObj = {
        content: desc,
        position: 'default'
      }
    }

    return createPortal(
      <div ref={(e: any) => {
        if (e) {
          if (descObj.position === 'right') {
            e.style.top = (po.y + po.h / 2 - e.offsetHeight / 2) + 'px'
            e.style.left = (po.x + po.w) + 'px'
          } else if (descObj.position === 'left') {
            e.style.top = (po.y + po.h / 2 - e.offsetHeight / 2) + 'px'
            e.style.left = (po.x - e.offsetWidth - 8) + 'px'
          } else {
            e.style.top = (po.y - e.offsetHeight - 3) + 'px'
            e.style.left = (po.x - e.offsetWidth / 2 + po.w / 2) + 'px'
          }
        }
      }} className={`${css.tooltip} 
      ${descObj.position === 'left' ? css.left : ''}
      ${descObj.position === 'right' ? css.right : ''}
      `}>
        <div className={css.arrow}>
          <div className={css.content}/>
        </div>
        <div className={css.inner}>
          <span>{descObj.content}</span>
        </div>
      </div>, document.body
    )
  }
}