import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, company, email, date, message } = data;

    // Validate inputs
    if (!name || !email || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'anishpatil146@gmail.com',
        pass: process.env.EMAIL_PASS, // Needs to be generated in Gmail Security (App Passwords)
      },
    });

    const mailOptions = {
      from: `"Company Handler Demo" <${process.env.EMAIL_USER || 'anishpatil146@gmail.com'}>`,
      to: 'anishpatil146@gmail.com',
      subject: `🎉 New Demo Booking: ${name} from ${company}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #10b981; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Demo Requested!</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <p style="font-size: 16px; color: #333;">You have a new booking request for a 1-on-1 walkthrough.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; width: 30%;">Name:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #111;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Company:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #111;">${company || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Email:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #111;"><a href="mailto:${email}" style="color: #10b981;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Preferred Date:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #111;">${date}</td>
              </tr>
            </table>

            <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #10b981;">
              <h3 style="margin-top: 0; color: #333; font-size: 14px; text-transform: uppercase;">Message / Focus Area:</h3>
              <p style="color: #555; line-height: 1.5; margin-bottom: 0;">${message || 'No additional message provided.'}</p>
            </div>

            <div style="margin-top: 30px; text-align: center;">
              <a href="mailto:${email}?subject=Re: Company Handler Demo Booking" style="background-color: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Reply to Client</a>
            </div>
          </div>
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
            This email was sent automatically from your Company Handler app.
          </div>
        </div>
      `,
    };

    // Note: If the EMAIL_PASS is not configured, this will throw an error.
    // However, the Firebase save happens first on the frontend, so the lead is not lost.
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Email sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending demo booking email:', error);
    // Return success: false but with 200 so the frontend doesn't crash catastrophically, 
    // or return 500. Let's return 500 so frontend catches it if needed, but we don't alert the user
    // aggressively if it's just a missing local API key.
    return NextResponse.json({ error: 'Failed to send email. Ensure EMAIL_PASS is set.' }, { status: 500 });
  }
}
