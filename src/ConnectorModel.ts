import {Serializable} from "@mybricks/rxui";
import {SerializeNS} from "./constants";
import {BaseModel, T_PinSchema} from "@sdk";

@Serializable(SerializeNS + `ConnectorModel`)
export default class ConnectorModel extends BaseModel {
  id: string

  type: string

  title: string

  desc: string

  //paramAry: { name: string, type: string, defaultValue: string }[] = []

  inputSchema: T_PinSchema

  // _inputSchema: T_PinSchema
  //
  // get inputSchema(){
  //   return this._inputSchema
  // }
  //
  // set inputSchema(s){
  //   debugger
  //
  //   this._inputSchema = s
  // }
  //

  outputSchema: T_PinSchema

  script: string

  createTime: number

  lastModifiedTime: number

  constructor(opts: { id, type, title,inputSchema, outputSchema, script }) {
    super();
    if (opts) {
      this.id = opts.id
      this.title = opts.title
      this.type = opts.type
      this.inputSchema = opts.inputSchema
      this.outputSchema = opts.outputSchema
      this.script = opts.script

      this.createTime = new Date().getTime()
    }
  }
}