import app from '+types/server/app'
import { hc } from 'hono/client'

const client = hc<typeof app>('/')
