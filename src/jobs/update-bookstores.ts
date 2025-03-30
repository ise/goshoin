import { TriggerClient } from '@trigger.dev/sdk'

const client = new TriggerClient({
  id: 'goshoin',
  apiKey: process.env.TRIGGER_API_KEY
})

client.defineJob({
  id: 'update-bookstores',
  name: 'Update Bookstores',
  version: '0.0.1',
  trigger: client.defineCron({
    cron: '0 0 * * *' // 毎日午前0時に実行
  }),
  run: async (payload, io, ctx) => {
    await io.runTask('update-bookstores', async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cron/update-bookstores`)
      if (!response.ok) {
        throw new Error('Failed to update bookstores')
      }
    })
  }
}) 