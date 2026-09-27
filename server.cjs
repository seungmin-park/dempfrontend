const express = require('express')
const serveStatic = require('serve-static')
const path = require('path')

const app = express()
module.exports = app

//here we are configuring dist to serve app files
app.use('/', serveStatic(path.join(__dirname, '/dist')))
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found' }))

// this * route is to serve project on different page routes except root `/`
app.get(/.*/, function (req, res) {
    res.sendFile(path.join(__dirname, '/dist/index.html'))
})

if (require.main === module) {
    const port = process.env.PORT || 5050
    app.listen(port)
    console.log(`app is listening on port: ${port}`)
}
