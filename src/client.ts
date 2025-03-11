import app from './server/app'

import { hc } from 'hono/client'

const client = hc<typeof app>('/')

client.route1[':id'].$get({
  param: {
    id: '123'
  }
})
