import { getSupabase } from './supabase.js'

async function getGraphToken() {
  const tenant = process.env.MICROSOFT_TENANT_ID || 'common'
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Microsoft Graph Credentials missing')
  const params = new URLSearchParams()
  params.append('client_id', clientId)
  params.append('client_secret', clientSecret)
  params.append('grant_type', 'client_credentials')
  params.append('scope', 'https://graph.microsoft.com/.default')
  const resp = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  })
  if (!resp.ok) {
    const errorText = await resp.text()
    console.error('Microsoft Token Error:', errorText)
    throw new Error(`Token error ${resp.status}: ${errorText}`)
  }
  const data = await resp.json()
  return data.access_token
}

export async function sendGraphMail({ to, cc, subject, html, attachments = [] }) {
  const token = await getGraphToken()
  const sender = process.env.MICROSOFT_SENDER_EMAIL || 'noreply@dsk-ug.de'
  const endpoint = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`
  
  const message = {
    subject,
    body: { contentType: 'HTML', content: html },
    toRecipients: [{ emailAddress: { address: to } }],
    ccRecipients: cc ? [{ emailAddress: { address: cc } }] : []
  }

  // Add attachments if provided
  if (attachments && attachments.length > 0) {
    message.attachments = attachments.map(att => ({
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: att.filename,
      contentType: att.contentType || 'application/pdf',
      contentBytes: att.content.toString('base64')
    }))
  }

  const body = {
    message,
    saveToSentItems: true
  }

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  })
  if (!resp.ok) {
    const t = await resp.text()
    throw new Error(`Graph sendMail ${resp.status}: ${t}`)
  }
}
