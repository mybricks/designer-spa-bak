import {Serializable, Ignore} from "@mybricks/rxui";
import {SerializeNS} from "./constants";
import {BaseUIModel} from "@sdk";
import ViewSlot from "./coms/ViewSlot";

type T_ViewStatus = 'min' | 'max' | 'normal'

@Serializable(SerializeNS + `ViewSlotModel`)
export default class ViewSlotModel extends BaseUIModel {
  showTitleBar: boolean

  title: string


  height: number | 'auto'

  heightRecover: number

  width: number

  closeable: boolean

  status: 'min' | 'max' | 'normal' | 'pop'

  isStatusOfNormal() {
    return !this.status || this.status === 'normal'
  }

  isStatusOfMax() {
    return this.status === 'max'
  }

  isStatusOfPop() {
    return this.status === 'pop'
  }

  recoverSize() {
    this.status = 'normal'
    this.height = this.heightRecover
  }

  activeTabId: string

  tabs: []

  constructor(opts: {
    closeable?: boolean,
    status?: T_ViewStatus,
    showTitleBar?: boolean,
    tabs?: string[],
    height?: number | 'auto',
    width?: number
  }) {
    super();
    if (opts) {
      const nopts = Object.assign({
        closeable: false,
        status: 'normal',
        tabs: [],
        showTitleBar: true,
        height: void 0,
        width: void 0
      }, opts)

      this.closeable = nopts.closeable
      this.status = nopts.status
      this.tabs = nopts.tabs
      this.showTitleBar = nopts.showTitleBar
      this.height = nopts.height
      this.width = nopts.width
    }
  }

  // addTab(id, title, jsx) {
  //   if (!this.tabs) {
  //     this.tabs = []
  //   }
  //   this.tabs.push({id, title, jsx})
  // }

  toJSX() {
    return <ViewSlot model={this}/>
  }
}