import css from "./StatusBar.less";
import React from "react";
import {observe, useComputed} from "@mybricks/rxui";
import SPAContext from "../SPAContext";
import {IconError, IconInfo, IconWarn} from "../utils/Icons";

export default function StatusBar() {
  const spaContext = observe(SPAContext, {from: 'parents'})
  const {eventLogs, model} = spaContext

  const statusInfo = useComputed(() => {
    if (spaContext.pageLoaded) {
      const jsx = []
      const mainModule = model.mainModule
      if (mainModule) {
        if (mainModule.slot) {
          const info = mainModule.slot.getSummaryInfo()
          jsx.push(
            <div key={'geo'}>
              <label>UI组件</label><i>{info.coms}</i>
              <label>插槽</label><i>{info.slots}</i>
            </div>
          )
        }
        if (mainModule.frame) {
          const info = mainModule.frame.getSummaryInfo()
          jsx.push(
            <div key={'topl'}>
              <label>卡片</label><i>{info.diagrams}</i>
              <label>逻辑组件</label><i>{info.coms}</i>
            </div>
          )
        }
      }
      return jsx
    }
  })

  const [lastLog, typeCss] = useComputed(() => {
    const lastLog = eventLogs.length > 0 ? eventLogs[eventLogs.length - 1] : void 0
    if (lastLog) {
      let icon, typeCss
      switch (lastLog.type) {
        case 'info': {
          icon = IconInfo
          typeCss = css.info
          break
        }
        case 'warn': {
          icon = IconWarn
          typeCss = css.warn
          break
        }
        case 'error': {
          icon = IconError
          typeCss = css.error
          break
        }
      }
      return [(
        <div className={`${css.lastLog} ${typeCss}`}>
          <span className={`${css.icon}`}>{icon}</span>
          {lastLog.msg}
        </div>
      ), typeCss]
    } else {
      return [null, null]
      // return (
      //   <div className={css.lastLog}>
      //     无事件
      //   </div>
      // )
    }
  })

  return (
    <div className={`${css.eventLog}`}>
      <div className={css.statistics}>
        <span>统计</span> {statusInfo}
      </div>
      {lastLog}
    </div>
  )
}