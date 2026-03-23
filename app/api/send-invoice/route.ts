import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const { clientName, clientEmail, companyName, value, assignedRep } = await request.json();

        if (!clientEmail) {
            return NextResponse.json({ success: false, error: 'No email provided' }, { status: 400 });
        }

        // Gmail SMTP Setup (Working configuration based on your setup)
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.NEXT_PUBLIC_EMAIL_USER,
                pass: process.env.NEXT_PUBLIC_EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Auto-generate random invoice number and current date
        const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
        const formattedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const mailOptions = {
            from: `"Company Handler Finance" <${process.env.NEXT_PUBLIC_EMAIL_USER}>`,
            to: clientEmail,
            subject: `Invoice ${invoiceNumber} from Company Handler`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                  
                  <!-- Invoice Header -->
                  <tr>
                    <td style="background-color: #0a0a0a; padding: 40px 35px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 3px; text-transform: uppercase;">Company Handler</h1>
                      <p style="color: #a1a1aa; margin: 10px 0 0 0; font-size: 14px;">Official Tax Invoice / Receipt</p>
                    </td>
                  </tr>

                  <!-- Billed To & Details -->
                  <tr>
                    <td style="padding: 40px 35px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="50%" valign="top">
                            <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Billed To</p>
                            <p style="margin: 8px 0 0 0; font-size: 16px; color: #18181b; font-weight: bold;">${clientName}</p>
                            <p style="margin: 4px 0 0 0; font-size: 14px; color: #52525b;">${companyName}</p>
                            <p style="margin: 4px 0 0 0; font-size: 14px; color: #52525b;">${clientEmail}</p>
                          </td>
                          <td width="50%" valign="top" align="right">
                            <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Invoice Details</p>
                            <p style="margin: 8px 0 0 0; font-size: 14px; color: #52525b;"><strong>Invoice No:</strong> ${invoiceNumber}</p>
                            <p style="margin: 4px 0 0 0; font-size: 14px; color: #52525b;"><strong>Date:</strong> ${formattedDate}</p>
                            <p style="margin: 4px 0 0 0; font-size: 14px; color: #52525b;"><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">PAID / WON</span></p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Items Table -->
                  <tr>
                    <td style="padding: 0 35px 30px 35px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                        <thead>
                          <tr style="border-bottom: 2px solid #e4e4e7;">
                            <th align="left" style="padding: 12px 0; color: #18181b; font-size: 14px;">Description</th>
                            <th align="right" style="padding: 12px 0; color: #18181b; font-size: 14px;">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style="border-bottom: 1px solid #f4f4f5;">
                            <td style="padding: 20px 0; color: #52525b; font-size: 15px;">Enterprise SaaS Plan / Service Deployment</td>
                            <td align="right" style="padding: 20px 0; color: #18181b; font-weight: bold; font-size: 15px;">$${Number(value).toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  <!-- Totals -->
                  <tr>
                    <td style="padding: 0 35px 40px 35px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="50%"></td>
                          <td width="50%">
                            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                              <table width="100%">
                                <tr>
                                  <td align="left" style="color: #52525b; font-size: 14px;">Subtotal</td>
                                  <td align="right" style="color: #18181b; font-size: 14px; font-weight: bold;">$${Number(value).toLocaleString()}</td>
                                </tr>
                                <tr>
                                  <td align="left" style="padding-top: 10px; color: #18181b; font-size: 18px; font-weight: 800;">Total Paid</td>
                                  <td align="right" style="padding-top: 10px; color: #10b981; font-size: 20px; font-weight: 900;">$${Number(value).toLocaleString()}</td>
                                </tr>
                              </table>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #fafafa; padding: 25px; text-align: center; border-top: 1px solid #e4e4e7;">
                      <p style="margin: 0; font-size: 13px; color: #71717a;">Thank you for your business, ${clientName}!</p>
                      <p style="margin: 5px 0 0 0; font-size: 12px; color: #a1a1aa;">Assigned Rep: ${assignedRep}</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Invoice Email API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}