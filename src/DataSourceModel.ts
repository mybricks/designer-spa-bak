import {Serializable} from "@mybricks/rxui";
import {SerializeNS} from "./constants";
import {BaseModel, T_PinSchema} from "@sdk";

@Serializable(SerializeNS + `DataSourceModel`)
export default class DataSourceModel extends BaseModel {
  id: string

  title: string

  desc:string

  script: string

  createTime:number

  lastModifiedTime:number

  constructor(opts: { id, title, script }) {
    super();
    if (opts) {
      this.id = opts.id
      this.title = opts.title
      this.script = opts.script

      this.createTime = new Date().getTime()
    }
  }
}