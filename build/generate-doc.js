const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const to = require('./to')
const marked = require('marked')

const generateConsole = (color, tip) => text => console.log(chalk[color](tip), text)
const successLog = generateConsole('green', '[OK]')
const failLog = generateConsole('red', '[ERROR]')
const generalLog = generateConsole('yellow', '[TIP]')

const resolve = dir => {
  return path.join(__dirname, '..', dir)
}

const readDirPromise = (path) => {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, data) => err ? reject(err) : resolve(data))
  })
}

const readUTF8FilePromise = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf-8', (err, data) => err ? reject(err) : resolve(data))
  })
}

const writeUTF8FilePromise = (dir, name, data) => {
  return new Promise((resolve, reject) => {
    const file = path.join(dir, name)
    fs.writeFile(file, data, 'utf-8', (err) => err ? reject(err) : resolve(data))
  })
}

const mkdirPromise = (path) => {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, err => err ? reject(err) : resolve('done'))
  })
}

const stableWriteFile = async (dir, name, data) => {
  try {
    await writeUTF8FilePromise(dir, name, data)
  } catch (err) {
    generalLog(`${dir}不存在，尝试创建。`)
    await mkdirPromise(dir)
    await writeUTF8FilePromise(dir, name, data)
  }
  successLog(`文件${dir} ${name}创建成功。`)
}

const generateCamelName = (...argv) => {
  const handleFirstLetter = (str) => str.replace(/\b\w+\b/g, word => word.substring(0, 1).toUpperCase() + word.substring(1))
  argv.map((el, index) => index === 0 ? el.toLowerCase() : handleFirstLetter(el))
  return argv.join('')
}

const ignoreDir = ['style', '_util', 'col', 'row']

const parseDemoMd = (md, path, component, name) => {
  const start = md.indexOf('---')
  const end = md.indexOf('---', start + 1)
  ;(start < -1 || end < -1) && failLog(`${path}文档头部说明不规范缺少'---'`)
  const header = md.slice(start + 4, end - 1)
  let json = {}
  header.split('\n').forEach(el => {
    const array = el.split(':')
    json[array[0].trim()] = array[1] && array[1].trim()
  })
  const vueHtml = `<${component}-${name}></${component}-${name}>\n`
  json.display = vueHtml
  const zhCNStart = md.indexOf('## zh-CN', end)
  const enUSStart = md.indexOf('## en-US', zhCNStart)
  const codeStart = md.indexOf('```` html')
  const codeEnd = md.indexOf('````', codeStart + 1)
  if (typeof json.order === 'undefined') {
    generalLog(`需要为文件${path}指定头部order`)
  }
  json.order = parseInt(json.order, 10)
  json.zhCN = md.slice(zhCNStart + 10, enUSStart)
  json.enUS = md.slice(enUSStart + 10, codeStart)
  json.codeMd = md.slice(codeStart, codeEnd + 4)
  json.code = md.slice(codeStart + 10, codeEnd)
  json.name = name
  json.component = component
  return json
}

const parseIndexMd = (md, lang) => {
  const start = md.indexOf('---')
  const end = md.indexOf('---', start + 1)
  ;(start < -1 || end < -1) && failLog(`${path}文档头部说明不规范缺少'---'`)
  const header = md.slice(start + 4, end - 1)
  let json = {}
  header.split('\n').forEach(el => {
    const array = el.split(':')
    json[array[0].trim()] = array[1] && array[1].trim()
  })
  const APIStart = md.indexOf('## API')
  json.beforeCode = md.slice(end + 4, APIStart)
  json.afterCode = md.slice(APIStart, md.length - 1)
  json.lang = lang
  return json
}

const readDeomMds = async (route, component, name) => {
  let mdErr, md
  ;[mdErr, md] = await to(readUTF8FilePromise(route))
  return mdErr ? failLog(`读取文件${route}失败`) : parseDemoMd(md, route, component, name)
}

const generateDocs = async (components) => {
  components.forEach(component => generateDoc(component))
}

const generateDomes = (route, demos) => {
  return demos.forEach(demo => {
    stableWriteFile(route, `${demo.name}.vue`, demo.code)
  })
}

const generateDoc = async (component) => {
  const componentsPath = resolve('components')
  const componentDemoPath = path.join(componentsPath, component, 'demo')
  let demos = []
  let componentDemoMdErr, componentDemoMdPaths
  ;[componentDemoMdErr, componentDemoMdPaths] = await to(readDirPromise(componentDemoPath))
  if (componentDemoMdErr) {
    failLog(`读取文件${componentDemoMdErr}失败`)
  } else {
    componentDemoMdPaths && await Promise.all(componentDemoMdPaths.map(componentDemoMdPath => {
      const route = path.join(componentDemoPath, componentDemoMdPath)
      const name = componentDemoMdPath.replace('.md', '')
      return readDeomMds(route, component, name)
    })).then(v => {
      demos = v
    })
  }

  let zhIndexErr, zhIndexContent, zhIndexJson
  ;[zhIndexErr, zhIndexContent] = await to(readUTF8FilePromise(path.join(componentsPath, component, 'index.zh-CN.md')))
  if (zhIndexErr) {
    failLog(`读取文件${component} zh-index 失败`)
  } else {
    zhIndexJson = parseIndexMd(zhIndexContent, 'zh-CN')
  }

  let enIndexErr, enIndexContent, enIndexJson
  ;[enIndexErr, enIndexContent] = await to(readUTF8FilePromise(path.join(componentsPath, component, 'index.en-US.md')))
  if (enIndexErr) {
    failLog(`读取文件${component} en-index 失败`)
  } else {
    enIndexJson = parseIndexMd(enIndexContent, 'en-US')
  }

  const zhData = zhIndexJson && generateVueContainer(zhIndexJson, demos)
  const enData = enIndexJson && generateVueContainer(enIndexJson, demos)
  const siteDocPath = path.join(resolve('site'), 'docs', component)
  generateDomes(path.join(siteDocPath, 'demo'), demos)
  zhIndexJson && stableWriteFile(siteDocPath, 'index-zh.vue', zhData)
  enIndexJson && stableWriteFile(siteDocPath, 'index-en.vue', enData)
  return demos
}

const generateVueContainer = (main, demos) => {
  const lang = main.lang
  let importString = ''
  let codeString = ''
  let componentsSting = ''

  demos.forEach(demo => {
    const desc = lang === 'zh-CN' ? marked(demo.zhCN) : marked(demo.enUS)
    const title = lang === 'zh-CN' ? demo['zh-CN'] : demo['en-US']
    const codeHtml = marked(demo.codeMd)
    const componentName = generateCamelName(demo.component, demo.name)
    const code =
    `
    <code-show
      title="${title}"
      desc="${desc}"
      code="${codeHtml}">
      ${demo.display}
    </code-show>
    `
    codeString += code
    importString += `import ${componentName} from './demo/${demo.name}'\n`
    componentsSting += `${componentName},\n`
  })
  const template =
  `<template>
    <container>
      <h1>${main.title} ${main.subtitle}</h1>
      ${main.beforeCode}
      <h2> 代码展示 </h2>
      ${codeString}
      ${main.afterCode}
    </container>
  </template>
  <script>
  import Container from '../common/container'
  import CodeShow from '../common/code-show'
  ${importString}
  export default {
    components: {
      ${componentsSting}
      Container,
      CodeShow
    }
  }
  </script>
  `
  return template
}
const params = process.argv.splice(2)
generateDocs(params)

// const generateRouterConfig = async () => {
//   await to(readDirPromise(path.join(resolve(site), 'docs')))
// }

const generateComponentsRouterConfig = async () => {
  let docsErr, docsPaths
  ;[docsErr, docsPaths] = await to(readDirPromise(path.join(resolve('site'), 'docs')))
  let importString = `import Vue from 'vue'
  import Router from 'vue-router'
  `
  let zhRouterConfig = '['
  let enRouterConfig = '['
  docsPaths && docsPaths.forEach(component => {
    const zhName = generateCamelName('zh', component)
    const enName = generateCamelName('eh', component)
    importString += `import ${zhName} from './docs/${component}/index-zh'\n`
    importString += `import ${enName} from './docs/${component}/index-en'\n`
    zhRouterConfig += `{
      path: '${component}',
      component: ${zhName},
      name: '${component}-zh'
    },`
    enRouterConfig += `{
      path: '${component}',
      component: ${enName},
      name: '${component}-en'
    },`
  })
  importString += 'Vue.use(Router)\n'
  zhRouterConfig += ']'
  enRouterConfig += ']'

  const config = `let router = new Router({
  routes: [
    {
      path: '/component/zh-CN',
      children: ${zhRouterConfig}
    },
    {
      path: '/component/en-US',
      children: ${enRouterConfig}
    }
  ]
})

export default router`
  const sitePath = path.join(resolve('site'))
  stableWriteFile(sitePath, 'router.js', importString + config)
}

generateComponentsRouterConfig()