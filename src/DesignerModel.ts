/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * CheMingjun @2019
 * mybricks@126.com
 */
import {Serializable, Ignore} from "@mybricks/rxui";
import {SerializeNS} from "./constants";
import {BaseUIModel} from "@sdk";
import {T_Module} from "./types";
import ViewSlotModel from "./ViewSlotModel";
import ConnectorModel from "./ConnectorModel";
import DataSourceModel from "./DataSourceModel";

@Serializable(SerializeNS + `StageViewModel`)
export default class DesignerModel extends BaseUIModel {
  designerVersion: number = 0.1

  mainModule: T_Module

  @Ignore
  factModule: T_Module//with blueprint

  //moduleNav: T_Module[] = []

  editViewWidth: number

  pluginDataset: {} = {}

  envVars: {
    envType: string
    userToken: string
    envParams: string
  } = {}

  _themes: { name, value }[] = []

  @Ignore
  get themes() {
    return this._themes
  }

  //Compatible for data before
  set themes(v) {
    if (Array.isArray(v)) {
      this._themes = v
    } else if (typeof v === 'object') {
      const ary = []
      for (let k in v) {
        ary.push({name: k, value: v[k]})
      }
      this._themes = ary
    }
  }

  viewSlots: { [id: string]: ViewSlotModel }

  @Ignore
  views: {
    [id: string]: {
      title: string,
      render: (opts?: { onToolbar }) => {},
      height?: number | 'auto'
    }
  }

  getCurModule(): T_Module {
    return this.mainModule
    //return this.moduleNav.length > 0 ? this.moduleNav[this.moduleNav.length - 1] : void 0
  }

  connectors: ConnectorModel[]

  addConnector(conModel: ConnectorModel) {
    if (!this.connectors) {
      this.connectors = []
    }
    this.connectors.push(conModel)
  }

  searchConnector(id: string): ConnectorModel {
    return this.connectors.find(con => con.id === id)
  }

  removeConnector(id: string) {
    this.connectors = this.connectors.filter(con => con.id !== id)
  }

  dataSources: DataSourceModel[]

  addDataSource(conModel: DataSourceModel) {
    if (!this.dataSources) {
      this.dataSources = []
    }
    this.dataSources.push(conModel)
  }

  searchDataSource(id: string): DataSourceModel {
    return this.dataSources.find(con => con.id === id)
  }

  removeDataSource(id: string) {
    this.dataSources = this.dataSources.filter(con => con.id !== id)
  }
}