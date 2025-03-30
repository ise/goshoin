import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function runUpdate() {
  const response = await fetch('http://localhost:3000/api/cron/update-bookstores/manual', {
    method: 'POST',
    headers: {
      'x-secret-key': process.env.CRON_SECRET_KEY || ''
    }
  })

  const data = await response.json()
  console.log('Update result:', data)
}

runUpdate().catch(console.error) 