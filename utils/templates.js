const fs = require('fs')
const ejs = require('ejs')

const renderTemplate = (path, ...argsRest) => {
    const content = fs.readFileSync(path).toString('utf8')
    return ejs.render(content, ...argsRest)
}

module.exports = {
    renderTemplate
}