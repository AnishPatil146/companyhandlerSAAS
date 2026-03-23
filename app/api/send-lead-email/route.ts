import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const { clientName, clientEmail, companyName, assignedRep } = await request.json();

        if (!clientEmail) {
            return NextResponse.json({ success: false, error: 'No email provided' }, { status: 400 });
        }

        // 🔥 Gmail SMTP Setup
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

        const mailOptions = {
            from: `"Company Handler" <${process.env.NEXT_PUBLIC_EMAIL_USER}>`,
            to: clientEmail,
            subject: `Welcome to Company Handler, ${clientName}! 🚀`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                  
                  <!-- 🔥 Premium Dark Header 🔥 -->
                  <tr>
                    <td style="background-color: #0a0a0a; padding: 40px 30px; text-align: center; border-bottom: 4px solid #10b981;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 4px; text-transform: uppercase; font-weight: 800;">COMPANY HANDLER</h1>
                      <p style="color: #10b981; margin: 10px 0 0 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Enterprise Intelligence</p>
                    </td>
                  </tr>

                  <!-- 🔥 Welcome Body 🔥 -->
                  <tr>
                    <td style="padding: 40px 35px; color: #3f3f46; line-height: 1.8;">
                      <h2 style="margin-top: 0; color: #18181b; font-size: 24px;">Welcome aboard, ${clientName}! 👋</h2>
                      <p style="font-size: 16px; color: #52525b;">We are absolutely thrilled to partner with <strong>${companyName}</strong>. Your pipeline request has been securely synced into our global network.</p>
                      
                      <!-- 🔥 Representative Highlight Box 🔥 -->
                      <div style="background-color: #f8fafc; border-left: 4px solid #10b981; border-radius: 0 8px 8px 0; padding: 25px; margin: 35px 0;">
                        <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px;">Your Dedicated Representative</p>
                        <p style="margin: 5px 0 0 0; font-size: 18px; color: #0f172a; font-weight: 700;">${assignedRep}</p>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #71717a;">They will be reaching out to you shortly to initiate the next phase of our operations.</p>
                      </div>

                      <p style="font-size: 15px; color: #52525b;">If you have any immediate questions, feel free to reply directly to this email. We are here to ensure your success.</p>

                      <!-- 🔥 Call to Action Button 🔥 -->
                      <div style="text-align: center; margin: 45px 0 20px 0;">
                        <a href="mailto:${process.env.NEXT_PUBLIC_EMAIL_USER}" style="background-color: #10b981; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25);">Contact Support Support &rarr;</a>
                      </div>
                    </td>
                  </tr>

                  <!-- 🔥 Clean Footer 🔥 -->
                  <tr>
                    <td style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #e4e4e7;">
                      <p style="margin: 0; font-size: 12px; color: #a1a1aa; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">COMPANY HANDLER INC.</p>
                      <p style="margin: 10px 0 0 0; font-size: 12px; color: #a1a1aa;">This is an automated secure communication. Please do not forward this email.</p>
                      <p style="margin: 5px 0 0 0; font-size: 12px; color: #d4d4d8;">&copy; ${new Date().getFullYear()} All rights reserved.</p>
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
        console.error('Email API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}