import app from './server/+types/app'
import { hc } from 'hono/client'
const client = hc<typeof app>('/')
