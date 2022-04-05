/* index.js */

import app from './api/middleware.js'

const port = 8080

app.addEventListener('listen', ({ port }) => console.log(`listening on port: ${port}`))

await app.listen({ port })