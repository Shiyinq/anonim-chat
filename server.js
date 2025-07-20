const express = require('express')
const app = express()
const port = process.env.PORT || 5000

const mainRouter = require('./src/routes')
app.use('/', mainRouter)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
}) 