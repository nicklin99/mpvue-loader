// vue compiler module for transforming `<tag>:<attribute>` to `require`

var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var resolveSrc = require('../../utils/resolve-src')

var defaultOptions = {
  img: 'src',
  image: 'xlink:href'
}

module.exports = (userOptions, fileOptions) => {
  var options = userOptions
    ? Object.assign({}, defaultOptions, userOptions)
    : defaultOptions

  return {
    postTransformNode: node => {
      transform(node, options, fileOptions)
    }
  }
}

function transform (node, options, fileOptions) {
  for (var tag in options) {
    if (node.tag === tag && node.attrs) {
      var attributes = options[tag]
      if (typeof attributes === 'string') {
        rewrite(node.attrsMap, attributes, fileOptions)
      } else if (Array.isArray(attributes)) {
        attributes.forEach(item => rewrite(node.attrsMap, item, fileOptions))
      }
    }
  }
}

function rewrite (attrsMap, name, fileOptions) {
  var value = attrsMap[name]
  if (value) {
    var firstChar = value.charAt(0)
    var { resourcePath, outputPath, context } = fileOptions
    var assetPath = path.resolve(resourcePath, '..', value)
    
    if (firstChar === '.') {
      var toPath = resolveSrc(context, assetPath)
      attrsMap[name] = `/${toPath}`
      copyAsset(assetPath, path.join(outputPath, toPath))
    }
    // 如果url`/`开头, 默认走staticPublicPath,不拷贝
    if (value.indexOf('/static') === 0) {
      attrsMap[name] = process.env.staticPublicPath + value.replace('/','')
    }
  }
}

function copyAsset (from, to) {
  var readStream = fs.createReadStream(from)
  mkdirp(path.dirname(to), err => {
    if (err) console.error(err)
    var writeStream = fs.createWriteStream(to)
    readStream.pipe(writeStream)
  })
}
