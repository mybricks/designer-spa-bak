import {render, createRoot} from '@mybricks/rxui'
import Designer from './Designer'

import {PcEditor} from '@mybricks/editors-pc-common';

import React, {memo, useMemo, forwardRef, version as ReactVersion} from "react";

//import servicePlugin from '@mybricks/plugin-connector-http'

import pkg from '../package.json'

console.log(`%c ${pkg.name} %c@${pkg.version}`, `color:#FFF;background:#fa6400`, ``, ``)


export default forwardRef((props, ref) => {
  return (
    <DesignerRender
      {...props}
      _ref={ref}/>
  )
})

function DesignerRender({
                          config, onMessage,
                          onEdit,
                          onClick, _ref
                        }) {
  const myConfig = deepAssign({
    //plugins: [servicePlugin],
    // comlibLoader(desc) {//加载组件库
    //   return new Promise((resolve, reject) => {
    //     resolve([testLib])
    //   })
    // },
    // pageContentLoader() {
    //   const pageContent = window.localStorage.getItem('--mybricks--')
    //   return new Promise((resolve, reject) => {
    //     resolve(pageContent ? JSON.parse(pageContent) : null)
    //   })
    // },
    geoView: {
      type: 'pc',
      modules: {
        adder: false
      },
      nav: {float: true},
      theme: {
        css: [
          'https://ali-ec.static.yximgs.com/udata/pkg/eshop/fangzhou/pub/pkg/antd-4.16.13/dist/antd.min.css',
          // 'https://ali-ec.static.yximgs.com/udata/pkg/eshop/fangzhou/res/global.7ec1844a853a56ed.css'
        ]
      }
    },
    toplView: {
      title: '交互',
      //useStrict: true,//default is true
      cards: {
        main: {
          title: '页面',
        },
      }
    },
    editView: {
      editorLoader(editConfig) {
        let editor
        if (typeof this.editorAppender === 'function') {
          editor = this.editorAppender(editConfig)
        }
        if (editor) {
          return editor
        }

        return PcEditor({editConfig, projectData: {}} as any)
      }
    },
    // com: {
    //   env: {
    //     i18n(title) {
    //       return title
    //     },
    //     callConnector(connector, params) {
    //       if (connector.type === 'http') {
    //         return callConnectorHttp({script: connector.script, params})
    //       } else {
    //         return Promise.reject('错误的连接器类型.')
    //       }
    //     },
    //   },
    //   events: [
    //     {
    //       type: 'jump',
    //       title: '跳转到',
    //       exe({options}) {
    //         const page = options.page
    //         if (page) {
    //           window.location.href = page
    //         }
    //       },
    //       options: [
    //         {
    //           id: 'page',
    //           title: '页面',
    //           editor: 'textarea'
    //         }
    //       ]
    //     },
    //   ]
    // }
  }, config || {})

  const jsx = useMemo(() => {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }} ref={el => {
        if (el) {
          if (ReactVersion.startsWith('18.')) {
            createRoot(el).render(
              <Designer config={myConfig}
                        onEdit={onEdit}
                        onMessage={onMessage}
                        onClick={onClick}
                        ref={(opts) => {
                          if (typeof _ref === 'function') {
                            _ref(opts)
                          } else if (typeof _ref === 'object') {
                            _ref.current = opts//refs
                          }
                        }}/>)
          } else {
            render(
              <Designer config={myConfig}
                        onEdit={onEdit}
                        onMessage={onMessage}
                        onClick={onClick}
                        ref={(opts) => {
                          if (typeof _ref === 'function') {
                            _ref(opts)
                          } else if (typeof _ref === 'object') {
                            _ref.current = opts//refs
                          }
                        }}/>, el)
          }
        }
      }}>
      </div>
    )
  }, [])


  return jsx
}


function callConnectorHttp({script, params}) {
  return new Promise((resolve, reject) => {
    try {
      const fn = eval(`(${script})`)
      fn(params, {then: resolve, onError: reject}, {
        ajax(opts) {
          let url = opts.url
          let headers
          let body

          if (opts.method.toUpperCase() === 'GET') {
            if (params) {
              let arr = []
              for (let objKey in params) {
                arr.push(objKey + "=" + params[objKey]);
              }
              url += `?${arr.join("&")}`
            }
          } else if (opts.method.toUpperCase() === 'POST') {
            if (params) {
              body = JSON.stringify(params)
              //headers = {'Content-Type': 'x-www-form-urlencoded;charset=UTF-8'}
              headers = {'Content-Type': 'application/json'}
            }
          }

          return new Promise((resolve1, reject1) => {
            window.fetch(url, {method: opts.method, body, headers})
              .then(response => {
                if (String(response.status).match(/^2\d{2}$/g)) {
                  if (response && typeof response.json === 'function') {
                    try {
                      return response.json()
                    } catch (ex) {
                      reject1(ex.message)
                    }
                  } else {
                    resolve1('')
                  }
                } else {
                  reject1(`服务连接错误（状态码 ${response.status}）`)
                }
              })
              .then(data => {
                resolve1(data)
              })
              .catch(err => {
                reject1(err.message)
              })
          })
        }
      })
    } catch (ex) {
      reject(`连接器script错误.`)
    }
  })
}

function deepAssign() {
  var args = Array.from(arguments);
  return args.reduce(deepClone, args[0]);

  function deepClone(target, obj) {
    if (!target) target = Array.isArray(obj) ? [] : {};
    if (obj && typeof obj === "object") {
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (obj[key] && typeof obj[key] === "object") {
            target[key] = deepClone(target[key], obj[key]);
          } else {
            target[key] = obj[key];
          }
        }
      }
    }
    return target;
  }
}