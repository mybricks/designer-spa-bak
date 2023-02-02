import {FrameModel} from "@mybricks/desn-topl-view";

export function doFrame(frame: FrameModel) {
  if (frame.frameAry) {
    frame.frameAry.forEach(doFrame)
  }

  if (frame.comAry) {
    frame.comAry.forEach((com, idx) => {
      if (com.forkedFrom && com.forkedFrom.parent === frame
        && frame.comAry.indexOf(com.forkedFrom) < 0) {//ToplcomModelForked
        frame.comAry.splice(idx, 1)
        frame.comAry.push(com.forkedFrom)
      }

      if (com.frames) {
        com.frames.forEach(doFrame)
      }
    })
  }

  // if(frame.diagramAry){
  //   frame.diagramAry.forEach(diagram=>{
  //     if(diagram){
  //
  //     }
  //   })
  // }
}