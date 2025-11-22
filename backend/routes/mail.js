import express from 'express'
import { Booking, Accommodation } from '../models/index.js'
import { getSupabase } from '../services/supabase.js'
import { generateBookingPDF } from '../services/pdfGenerator.js'

import { authenticate, permit } from '../middleware/auth.js'
import { sendGraphMail } from '../services/mail.js'

const router = express.Router()

const required = (obj, keys) => keys.every(k => obj && obj[k])
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || ''))

router.post('/send-confirmation/:bookingId', authenticate, permit('admin', 'editor'), async (req, res) => {
  try {
    const { bookingId } = req.params
    const booking = await Booking.findByPk(bookingId, {
      include: [Accommodation]
    })

    if (!booking) {
      return res.status(404).json({ success: false, msg: 'Buchung nicht gefunden' })
    }

    const acc = booking.Accommodation
    if (!acc) {
      return res.status(404).json({ success: false, msg: 'Unterkunft nicht gefunden' })
    }

    const guestEmail = booking.guest_email
    if (!isEmail(guestEmail)) {
      return res.status(400).json({ success: false, msg: 'Ungültige Gäste-E-Mail' })
    }

    const subject = `Buchungsbestätigung #${booking.id} - ${acc.name}`
    const checkIn = new Date(booking.check_in).toLocaleDateString('de-DE')
    const checkOut = new Date(booking.check_out).toLocaleDateString('de-DE')
    
    const html = `
      <h2>Buchungsbestätigung</h2>
      <p>Sehr geehrte/r ${booking.guest_name},</p>
      <p>wir freuen uns, Ihnen mitteilen zu können, dass Ihre Buchung bestätigt wurde.</p>
      
      <h3>Details zur Unterkunft:</h3>
      <p><strong>Unterkunft:</strong> ${acc.name}</p>
      <p><strong>Adresse:</strong> ${acc.address}, ${acc.location}</p>
      
      <h3>Buchungsdaten:</h3>
      <p><strong>Check-in:</strong> ${checkIn}</p>
      <p><strong>Check-out:</strong> ${checkOut}</p>
      <p><strong>Gesamtpreis:</strong> €${Number(booking.total_price).toFixed(2)}</p>
      
      <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
      <br>
      <p>Mit freundlichen Grüßen<br>Ihr DSK-UG Team</p>
    `

    await sendGraphMail({
      to: guestEmail,
      subject,
      html
    })

    // Update status if not already confirmed
    if (booking.status !== 'confirmed') {
      booking.status = 'confirmed'
      await booking.save()
    }

    res.json({ success: true, msg: 'Bestätigungs-E-Mail gesendet' })
  } catch (err) {
    console.error('[mail:send-confirmation]', err)
    res.status(500).json({ success: false, msg: 'Fehler beim Senden der Bestätigung: ' + err.message })
  }
})

router.post('/send-booking', async (req, res) => {
  try {
    const b = req.body || {}
    const ok = required(b, ['accommodationId','accommodationName','guestName','guestEmail','guestPhone','checkIn','checkOut','guests'])
    if (!ok) return res.status(400).json({ success: false, msg: 'Fehlende Felder' })
    if (!isEmail(b.guestEmail)) return res.status(400).json({ success: false, msg: 'Ungültige E-Mail' })
    const ci = new Date(b.checkIn), co = new Date(b.checkOut)
    if (!(ci instanceof Date) || !(co instanceof Date) || isNaN(ci) || isNaN(co) || co <= ci) {
      return res.status(400).json({ success: false, msg: 'Ungültiger Zeitraum' })
    }
    const guests = Number(b.guests)
    if (!Number.isInteger(guests) || guests <= 0) return res.status(400).json({ success: false, msg: 'Ungültige Gästezahl' })

    // Validate that the accommodation exists
    // Validate that the accommodation exists (Lazy Sync with Supabase)
    let accommodation = await Accommodation.findByPk(b.accommodationId)
    
    if (!accommodation) {
      console.log(`⚠️ Accommodation ${b.accommodationId} not found locally. Checking Supabase...`)
      const supa = getSupabase()
      const { data: remoteAcc, error } = await supa
        .from('accommodations')
        .select('*')
        .eq('id', b.accommodationId)
        .single()
      
      if (remoteAcc && !error) {
        console.log(`✅ Found in Supabase. Syncing to local DB...`)
        try {
          accommodation = await Accommodation.create({
            id: remoteAcc.id,
            name: remoteAcc.name,
            description: remoteAcc.description || remoteAcc.details,
            price_per_night: remoteAcc.price_per_night,
            max_guests: remoteAcc.max_guests,
            is_active: remoteAcc.is_active,
            location: remoteAcc.location,
            address: remoteAcc.address,
            amenities: remoteAcc.amenities || [],
            images: remoteAcc.images || [],
            details: remoteAcc.details,
            about: remoteAcc.about,
            connectivity: remoteAcc.connectivity,
            house_rules: remoteAcc.house_rules,
            reviews: remoteAcc.reviews || []
          })
          console.log(`✅ Synced accommodation ${accommodation.id} to local DB.`)
        } catch (syncErr) {
          console.error('❌ Failed to sync accommodation:', syncErr)
          // Fallback: Try to find it again in case of race condition
          accommodation = await Accommodation.findByPk(b.accommodationId)
        }
      }
    }

    if (!accommodation) {
      console.log('❌ Accommodation not found in Supabase either:', b.accommodationId)
      return res.status(400).json({ success: false, msg: 'Unterkunft nicht gefunden' })
    }

    const nights = Math.ceil((co - ci) / (1000 * 60 * 60 * 24))
    
    // Check availability for all days in the range
    const { Op } = await import('sequelize')
    const existingBookings = await Booking.findAll({
      where: {
        accommodation_id: b.accommodationId,
        status: { [Op.not]: 'cancelled' },
        [Op.or]: [
          // Check if any booking overlaps with requested dates
          {
            check_in: { [Op.lt]: b.checkOut },
            check_out: { [Op.gt]: b.checkIn }
          }
        ]
      }
    })

    // Check if any day in the requested range is blocked
    const dayMs = 24 * 60 * 60 * 1000
    for (let d = new Date(ci); d < new Date(co); d = new Date(d.getTime() + dayMs)) {
      const isBlocked = existingBookings.some(booking => {
        const bookingStart = new Date(booking.check_in)
        const bookingEnd = new Date(booking.check_out)
        return d >= bookingStart && d < bookingEnd
      })
      
      if (isBlocked) {
        return res.status(400).json({ 
          success: false, 
          msg: `Der Zeitraum ist nicht vollständig verfügbar. Mindestens der ${d.toLocaleDateString('de-DE')} ist bereits gebucht.`
        })
      }
    }

    // Check minimum stay requirement (if set on accommodation)
    const minStay = accommodation.min_stay || 0
    if (minStay > 0 && nights < minStay) {
      return res.status(400).json({
        success: false,
        msg: `Mindestaufenthalt für diese Unterkunft: ${minStay} ${minStay === 1 ? 'Nacht' : 'Nächte'}. Sie haben ${nights} ${nights === 1 ? 'Nacht' : 'Nächte'} gewählt.`
      })
    }

    const totalPrice = Number(b.totalPrice || 0)
    const to = process.env.MICROSOFT_MAIL_TO || 'info@dsk-ug.de'

    // Save booking to database
    const booking = await Booking.create({
      accommodation_id: b.accommodationId,
      guest_name: b.guestName,
      guest_email: b.guestEmail,
      check_in: b.checkIn,
      check_out: b.checkOut,
      total_price: totalPrice,
      status: 'pending',
      notes: `Gäste: ${guests}\nTelefon: ${b.guestPhone}\n${b.specialRequests ? `Wünsche: ${b.specialRequests}` : ''}`
    })

    const html = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Buchungsbestätigung - DSK-UG</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                
                <!-- Header with Logo -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">DSK-UG</h1>
                    <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 18px; font-weight: 500;">Monteurunterkünfte Leipzig</p>
                  </td>
                </tr>
                
                <!-- Greeting -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px;">
                    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">Sehr geehrte/r ${b.guestName},</h2>
                    <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      vielen Dank für Ihre Buchungsanfrage! Wir haben Ihre Anfrage erhalten und werden uns schnellstmöglich bei Ihnen melden.
                    </p>
                  </td>
                </tr>
                
                <!-- Booking Details -->
                <tr>
                  <td style="padding: 0 40px 30px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 20px;">
                      <tr>
                        <td colspan="2" style="padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
                          <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">📋 Buchungsdetails</h3>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px 0 8px 0; color: #6b7280; font-size: 14px;">Unterkunft:</td>
                        <td style="padding: 15px 0 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${b.accommodationName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Check-in:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${ci.toLocaleDateString('de-DE', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Check-out:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${co.toLocaleDateString('de-DE', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Anzahl Nächte:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${nights} ${nights === 1 ? 'Nacht' : 'Nächte'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Anzahl Gäste:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${guests} ${guests === 1 ? 'Person' : 'Personen'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 15px 0 0 0; border-top: 2px solid #e5e7eb; color: #1f2937; font-size: 16px; font-weight: 600;">Gesamtpreis:</td>
                        <td style="padding: 15px 0 0 0; border-top: 2px solid #e5e7eb; color: #2563eb; font-size: 18px; font-weight: 700; text-align: right;">€${totalPrice.toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                ${b.specialRequests ? `
                <tr>
                  <td style="padding: 0 40px 30px 40px;">
                    <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px; font-weight: 600;">💬 Besondere Wünsche:</h3>
                    <p style="margin: 0; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; color: #92400e; font-size: 14px; line-height: 1.6; border-radius: 4px;">
                      ${String(b.specialRequests).replace(/\n/g,'<br>')}
                    </p>
                  </td>
                </tr>
                ` : ''}
                
                <!-- Contact Info -->
                <tr>
                  <td style="padding: 0 40px 30px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 6px; padding: 20px;">
                      <tr>
                        <td>
                          <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: 600;">📞 Kontaktdaten</h3>
                          <p style="margin: 0 0 6px 0; color: #1f2937; font-size: 14px;"><strong>Name:</strong> ${b.guestName}</p>
                          <p style="margin: 0 0 6px 0; color: #1f2937; font-size: 14px;"><strong>E-Mail:</strong> ${b.guestEmail}</p>
                          <p style="margin: 0; color: #1f2937; font-size: 14px;"><strong>Telefon:</strong> ${b.guestPhone}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer / Signature -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                      Mit freundlichen Grüßen<br>
                      <strong style="color: #1f2937;">Ihr DSK-UG Team</strong>
                    </p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 20px 0 0 0; border-top: 1px solid #e5e7eb;">
                          <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 15px; font-weight: 600;">DSK UG (haftungsbeschränkt)</p>
                          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 13px;">Engertstraße 6a, 04177 Leipzig</p>
                          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 13px;">📞 Telefon: +49 151 71421923</p>
                          <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px;">🌐 Webseite: <a href="https://dsk-ug.de" style="color: #2563eb; text-decoration: none;">dsk-ug.de</a></p>
                          
                          <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 1.5;">
                            Geschäftsführerin: Petra Scheffler | Sitz der Gesellschaft: Leipzig<br>
                            Amtsgericht Leipzig, HRB 36406 | USt-ID: DE324735122
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Reference Number -->
                <tr>
                  <td style="padding: 15px 40px; background-color: #f3f4f6; text-align: center;">
                    <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                      Referenznummer: #${booking.id} | Erstellt am ${new Date().toLocaleDateString('de-DE')}
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    // Generate PDF attachment
    const pdfBuffer = await generateBookingPDF({
      bookingId: booking.id,
      accommodationName: b.accommodationName,
      guestName: b.guestName,
      guestEmail: b.guestEmail,
      guestPhone: b.guestPhone,
      checkIn: ci.toLocaleDateString('de-DE', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }),
      checkOut: co.toLocaleDateString('de-DE', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }),
      nights,
      guests,
      totalPrice,
      specialRequests: b.specialRequests || ''
    })

    const attachments = [{
      filename: `Buchungsbestaetigung_${booking.id}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }]

    await sendGraphMail({ 
      to, 
      cc: b.guestEmail, 
      subject: `Buchungsbestätigung #${booking.id} - ${b.accommodationName}`, 
      html,
      attachments 
    })
    res.json({ success: true, bookingId: booking.id })
  } catch (err) {
    console.error('[mail:send-booking]', err.message)
    res.status(500).json({ success: false, msg: 'E-Mail Versand fehlgeschlagen: ' + err.message })
  }
})

export default router