import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, company, challenge, bookingDate } = body;

    if (!name || !email || !company || !bookingDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Safely pulling variables without NEXT_PUBLIC_
    const user = process.env.NEXT_PUBLIC_EMAIL_USER;
    const pass = process.env.NEXT_PUBLIC_EMAIL_PASS;

    if (!user || !pass) {
      console.error("Missing email credentials in environment variables.");
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const formattedDate = new Date(bookingDate).toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: user,
        pass: pass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // 1. Sleek Demo Confirmation Email to Client
    const clientMailOptions = {
      from: `"Demo Booking" <${user}>`,
      to: email,
      subject: 'Demo Session Confirmed 🎉',
      html: `
        <div style="background-color: #f4f5f7; padding: 40px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            
            <div style="background-color: #111111; padding: 30px 20px; text-align: center; border-bottom: 4px solid #10b981;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">BOOKING CONFIRMED</h1>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="margin-top: 0; color: #1f2937; font-size: 22px;">Thank you, ${name}! 👋</h2>
              <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Your demo session for <strong>${company}</strong> has been successfully scheduled. We are looking forward to meeting you and discussing how we can help with your automation needs.</p>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 30px 0;">
                 <p style="margin: 0 0 5px 0; font-size: 11px; font-weight: bold; color: #64748b; letter-spacing: 1px; text-transform: uppercase;">DATE & TIME</p>
                 <p style="margin: 0 0 20px 0; font-size: 16px; color: #2563eb; font-weight: 500;">${formattedDate}</p>

                 <p style="margin: 0 0 5px 0; font-size: 11px; font-weight: bold; color: #64748b; letter-spacing: 1px; text-transform: uppercase;">STATUS</p>
                 <p style="margin: 0; font-size: 18px; color: #10b981; font-weight: bold; letter-spacing: 1px;">Confirmed</p>
              </div>

              <p style="color: #64748b; font-size: 13px; text-align: center; margin-bottom: 30px; line-height: 1.5;">If you have any questions before our meeting or need to reschedule, please feel free to reply directly to this email.</p>

              <div style="text-align: center;">
                <a href="mailto:anishpatil146@gmail.com" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 15px; transition: background-color 0.3s;">Contact Support &rarr;</a>
              </div>
            </div>

          </div>
        </div>
      `,
    };

    // 2. Simple Admin Notification Email (Goes to you)
    const adminMailOptions = {
      from: `"Booking System" <${user}>`,
      to: 'anishpatil146@gmail.com',
      subject: `🚀 New Demo Booking: ${company}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h2>New Demo Session Booked</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Session Date</td>
              <td style="padding: 10px; border: 1px solid #ddd; color: #10b981; font-weight: bold;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Name</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Email</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Company</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${company}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Challenge</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${challenge || 'N/A'}</td>
            </tr>
          </table>
        </div>
      `,
    };

    await Promise.all([
      transporter.sendMail(clientMailOptions),
      transporter.sendMail(adminMailOptions),
    ]);

    return NextResponse.json({ message: 'Booking confirmed successfully' }, { status: 200 });

  } catch (error) {
    // This logs the exact error to your terminal if something still goes wrong
    console.error('🔥 THE EXACT EMAIL ERROR IS:', error);
    return NextResponse.json({ error: 'Failed to process booking' }, { status: 500 });
  }
}