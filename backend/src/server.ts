import 'dotenv/config'
import app, { logger } from './app'

const PORT = Number(process.env.PORT) || 3000

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Pinstory backend started')
})
