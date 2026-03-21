import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

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

        // 🔥 BUTTON KE LIYE LINK: Abhi localhost hai, live hone par aap ise change kar lena
        const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const mailOptions = {
            from: `"NEXUS ERP" <${process.env.NEXT_PUBLIC_EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to NEXUS ERP - Your Account is Ready!',
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
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                  
                  <!-- Premium Header -->
                  <tr>
                    <td style="background-color: #0a0a0a; padding: 35px; text-align: center; border-bottom: 4px solid #10b981;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 26px; letter-spacing: 3px; text-transform: uppercase;">NEXUS ERP</h1>
                    </td>
                  </tr>

                  <!-- Welcome Body -->
                  <tr>
                    <td style="padding: 40px 30px; color: #3f3f46; line-height: 1.6;">
                      <h2 style="margin-top: 0; color: #18181b; font-size: 22px;">Welcome aboard, ${name}! 👋</h2>
                      <p style="font-size: 16px; color: #52525b;">Your enterprise account has been successfully created. Below are your secure login credentials to access the system.</p>
                      
                      <!-- Secure Credentials Box -->
                      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 35px 0;">
                        <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px;">Email Address</p>
                        <p style="margin: 5px 0 20px 0; font-size: 16px; color: #0f172a; font-weight: 600;">${email}</p>
                        
                        <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px;">Temporary Password</p>
                        <p style="margin: 5px 0 0 0; font-size: 20px; color: #10b981; font-family: monospace; font-weight: bold; letter-spacing: 2px;">${password}</p>
                      </div>

                      <p style="font-size: 14px; color: #71717a; text-align: center;">Please log in using the button below. We highly recommend changing your password immediately after your first login for security purposes.</p>

                      <!-- 🔥 MAGIC LOGIN BUTTON 🔥 -->
                      <div style="text-align: center; margin: 40px 0 20px 0;">
                        <a href="${loginUrl}" style="background-color: #10b981; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">Access Dashboard &rarr;</a>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #fafafa; padding: 25px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
                      <p style="margin: 0; font-size: 12px; color: #a1a1aa;">This is an automated message from the NEXUS Management System. Please do not reply to this email.</p>
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
        return NextResponse.json({ success: true, message: 'Email sent successfully!' });
    } catch (error: unknown) {
        console.error("Email error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}