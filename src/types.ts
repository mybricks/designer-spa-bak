import {T_XGraphComLib} from "@sdk";
import {GeoViewModel} from "@mybricks/desn-geo-view";
import {ToplViewModel} from "@mybricks/desn-topl-view";

export type T_Params = {
  config: T_DesignerConfig,
  ref: (fn: (ref: {
    importProject(content: { pageAry: {}[] }): boolean
    importComponent(content: { def, model }): boolean
    dump(): { [p: string]: {} }
    geoView: { canvasDom }
  }) => void) => void

  onMessage: (type: 'info' | 'warn' | 'error' | 'trace', message: string) => void

  onEdit: (event: 'change', content?) => void

  onClick: (event) => void
}

export type Action = {
  id: string;
  title: string;
  active?: boolean;
  exe: () => void;
}


export type T_Module = {
  instId: string
  title: string
  slot: GeoViewModel
  frame: ToplViewModel
}


export type T_Page = {
  //id: string,
  title: string,
  //type?: 'dialog' | undefined,
  content: { [name: string]: {} },
  // parentId?: string,
  // children: T_Page[]
  // props?: {
  //   isHome: boolean
  // }
  ele?: HTMLElement
}

export type T_Service = {
  id: string,
  title: string,
  content: { [name: string]: {} },
  parentId?: string,
  children: T_Service[]
  isActive?: boolean,
  ele?: HTMLElement
}


export type T_DesignerConfig = {
  mode: 'dev' | 'pro' | undefined

  env: 'dev'

  '@x': 1

  title: string

  comlibLoader: () => Promise<T_XGraphComLib[]>

  comlibAdder: any

  pageContentLoader: () => (pageId?: string) => Promise<{
    focusPageId: string,
    pageAry: {
      id: string,
      isActive: boolean,
      props: {
        isHome: boolean
      },
      title: string,
      content: { [name: string]: {} }
    }[]
  }>

  editorLoader: ({type, title, value, options, _onError_}) => {}

  dataSourceLoader: () => {}

  keymaps: () => { [keys: string]: () => void }

  navView

  // geoView: {
  //   '@x': 1 | 2
  //   zoom: number,
  //   type: 'pc' | 'mobile',
  //   layout: 'flow' | 'absolute'
  //   style: {
  //     height: number,
  //     width: number
  //   }
  //   configs: {
  //     title: string,
  //     items: {
  //       id: string,
  //       title: string,
  //       type: string,
  //       options?,
  //       value: {
  //         get: () => any,
  //         set: (v: any) => any
  //       }
  //     }[]
  //   }
  // }

  geoView: {
    type: 'mobile' | 'pc'
    zoom: number
    layout: 'absolute' | 'normal'
    overflow: 'hidden' | 'auto' | 'default'
    height: number
    width: number
    theme: {
      css: string[]
    }
    style: {}
  }

  toplView: {
    display: boolean
    title: string
    inputs: { id: string, title: string, connect: (fn) => void }[],
    outputs: { id: string, title: string, connect: (fn) => void }[],
    globalIO: {
      editable: boolean
    }
  }

  editView: {
    width: number
    items: [{
      title: string, items: [{
        title: string,
        type: string,
        options: any,
        value: { get, set }
      }]
    }]
    geoCom: {
      commonEditors: {
        enable: false
      }
      appendEditors: {
        title: string,
        type: 'text' | 'textarea',
        description: string,
        value: { get, set }
      }[]
    }
  }

  debug: {
    envTypes: { id: string, title: string }[]
  }

  envAppenders: {
    runtime: {}
  }
}