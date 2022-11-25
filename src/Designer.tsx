import css from './Designer.less'

import React, {forwardRef, useMemo} from "react";

import {evt, useComputed, useObservable} from "@mybricks/rxui";
import {DesignerContext} from "@sdk";

import SliderView from './coms/SliderView'
import EditView from "@mybricks/desn-edit-view";
import {GeoView} from '@mybricks/desn-geo-view'

import SPAContext from "./SPAContext";
import initContext from './utils/initContext'
import initEmits from './utils/initEmits'
import initModel from './utils/initModel'

import {getConfigs} from "./configrable";
import {T_Params} from "./types";
import ViewSlotModel from "./ViewSlotModel";
import ViewSlot from "./coms/ViewSlot";
import {ToplView} from "@mybricks/desn-topl-view";

import StatusBar from "./coms/StatusBar";
import ColView from "./coms/ColView";

import Tooltips from "./coms/Tooltips";
import Listening from "./coms/Listening";

let spaContext: SPAContext

function Designer({config, onMessage, onEdit, onClick, _ref}: T_Params) {
  //Global context
  const desnContext = useObservable(DesignerContext, {
    to: 'children'
  })

  useMemo(() => {
    desnContext.configs = config
  }, [])

  spaContext = initContext(desnContext, {config, onMessage, onEdit, onClick, ref: _ref})
  initEmits(spaContext)

  const model = initModel(spaContext)

  useMemo(() => {
    spaContext.model = model

    if (!model.viewSlots) {
      model.viewSlots = {}

      if (config.geoView) {
        model.viewSlots['top'] = new ViewSlotModel({
          showTitleBar: false,
          tabs: ['geoView'],
          height: 'auto'
        })
      }

      if (config.toplView) {
        model.viewSlots['bottom'] = new ViewSlotModel({
          //height: 400,
          status: config.geoView ? 'min' : 'normal',
          tabs: ['toplView'],
          height: config.geoView ? void 0 : 'auto',
          showTitleBar: !!config.geoView
        })
      }
    }

    if (!model.views) {
      model.views = {}
    }

    if (config.geoView) {
      model.views['geoView'] = {
        title: '布局',
        render() {
          const curModule = model.getCurModule()
          if (curModule) {
            const viewModel = model.getCurModule().slot
            // viewModel.state.enable()
            return <GeoView viewModel={viewModel}
                            page={spaContext.curPage}
                            themes={model.themes}
            />
          }
        }
      }
    }

    if (config.toplView) {
      model.views['toplView'] = {
        title: config.toplView.title || '未命名',
        render({onToolbar}) {
          const curModule = model.getCurModule()
          if (curModule) {
            const frameModel = curModule.frame
            //frameModel.state.enable()
            return <ToplView
              viewId={'bottom'}
              viewModel={frameModel}
              onToolbar={onToolbar}
              debugParams={spaContext.curDebugParams}/>
          }
        }
      }
    }
  }, [model.viewSlots])//刷新

  useComputed(() => {
    if (spaContext.loaded) {
      const mode = desnContext.configs.mode
      if (mode) {
        if (mode.toLowerCase() === 'blueprint') {
          desnContext.setModeDesnOfBluePrint()
        }
        if (mode.toLowerCase() === 'component') {
          desnContext.setModeDesnOfComponent()
        }
      }

      if (!model.pluginDataset) {
        model.pluginDataset = {}
      }
      desnContext.initPluginDataset(model.pluginDataset)
    }
  })

  const midView = useComputed(() => {
    if (spaContext.loaded) {
      const hasGeoView = config.geoView, hasToplView = config.toplView

      const toplViewStyle = !hasGeoView ? {height: '100%'} : void 0

      return (
        <>
          {
            hasGeoView ? (
              <ViewSlot id='top' style={{overflow: 'hidden'}}/>
            ) : null
          }
          {
            hasToplView ? (
              <ViewSlot id='bottom' min={hasGeoView} style={toplViewStyle} ifVisible={() => {
                // const activePlugin: T_Plugin = desnContext.getActivePlugin()
                // if (desnContext.isDesnMode()) {
                //   return !(activePlugin?.contributes?.views?.activityBar?.tab?.active?.views?.topl?.visible === false)
                // }

                const toplCfg = config.toplView
                if (toplCfg?.display === false) {
                  return false
                }

                return true
              }}/>
            ) : null
          }
        </>
      )
    } else {
      return (
        <div className={css.loading}>
          加载中，请稍后...
        </div>
      )
    }
  })

  useComputed(() => {
    if (spaContext.loaded) {
      desnContext.model = model

      desnContext.focusDefault = {
        getConfigs() {
          return getConfigs(spaContext)
        }
      } as any
    }
  })

  // useLayoutEffect(() => {
  //   desnContext.blur()
  //
  // }, [])

  const classNames = useComputed(() => {
    const rtn = [css.designerUi]
    if (desnContext.isShowModelFullScreen()) {
      rtn.push(css.fullScreen)
    }
    if (!spaContext.showEditView) {
      rtn.push(css.hideEditView)
    }
    if (!spaContext.showNavView || desnContext.isDebugMode()) {
      rtn.push(css.hideNavView)
    }

    // if(spaContext.reLayout){
    //   rtn.push(css.freeze)
    // }

    return rtn.join(' ')
  })

  const maxView = useComputed(() => {
    const mv = spaContext._maxView
    if (mv) {
      spaContext.showNavView = false
      if (!mv.options?.showEditView) {
        spaContext.showEditView = false
      }

      model.views['_maxView'] = {
        status: 'max',
        title: mv.title,
        render() {
          return mv.content()
        }
      }

      function closeFn() {
        try {
          spaContext._maxView = void 0
          if (typeof mv.options?.onClose === 'function') {
            mv.options.onClose()
          }
        } finally {
          spaContext.showNavView = true
          spaContext.showEditView = true
        }
      }

      return (
        <div className={css.lyMax} key={'max'}>
          <ViewSlot id={'_maxView'} onClose={closeFn}/>
        </div>
      )
    }
  })

  const popView = useComputed(() => {
    const pv = spaContext._popView
    if (pv) {
      model.views['_popView'] = {
        status: 'pop',
        title: pv.title,
        render() {
          return pv.content({
            close() {
              closeFn()
            }
          })
        }
      }

      const opts = pv.options

      function closeFn() {
        spaContext._popView = void 0
        if (typeof opts?.onClose === 'function') {
          opts.onClose()
        }
      }

      const popStyle = {} as any
      if (opts) {
        if (opts.width) {
          popStyle.width = opts.width
        }
        if (opts.beforeEditView) {
          popStyle.right = model.editViewWidth
        }
      }

      return (
        <div className={css.popBg} onClick={closeFn}>
          <div className={`${css.lyPop} ${opts?.beforeEditView ? css.lyPopEdit : css.lyPopR}`} key={'pop'}
               style={popStyle} onClick={evt().stop}>
            <ViewSlot id={'_popView'} onClose={closeFn}/>
          </div>
        </div>
      )
    }
  })

  const styles = useComputed(() => {
    const rtn = {
      main: void 0,
      edt: void 0
    }

    const mv = spaContext._maxView
    if (mv) {
      if (mv.options?.showEditView) {
        rtn.main = {display: 'none'}
      } else {
        rtn.main = {display: 'none'}
        rtn.edt = {display: 'none'}
      }
    }

    return rtn
  })

  const plugins = desnContext.configs?.plugins

  const editViewCfg = config.editView

  return (
    <blockquote className={classNames}
                ref={ele => ele && (spaContext.ele = ele)}
                tabIndex={1}>
      <div className={css.lyMain}>
        {
          plugins?.length > 0 ? (
            <SliderView style={maxView ? {display: 'none'} : void 0}/>
          ) : null
        }
        {maxView}

        <div className={css.lyStage} key={'main'} style={styles.main}>
          {midView}
        </div>
        <ColView style={styles.edt}
                 width={model.editViewWidth || editViewCfg?.width || 280}
                 onResize={width => {
                   model.editViewWidth = width
                 }}
                 resizer={'left'}>
          <EditView config={config}/>
        </ColView>
        {popView}
      </div>
      <StatusBar/>
      <Tooltips/>
      <Listening spaContext={spaContext}/>
    </blockquote>
  )
}

export default forwardRef((props, ref) => {
  return (
    <Designer {...props}
              _ref={ref}
              _onError_={(ex, type) => {
                console.error(ex)

                const msg = ex.message || ex
                if (type === 'render') {
                  return (
                    <div style={{padding: 10, color: 'red'}}>
                      系统运行错误:{msg}
                    </div>
                  )
                }
              }}/>
  )
})
