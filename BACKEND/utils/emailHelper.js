const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, html = null, retries = 3) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: parseInt(process.env.EMAIL_PORT) === 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: `"Smart Motor Automation" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html: html || text
    };

    for (let i = 0; i < retries; i++) {
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`Email sent: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`Email attempt ${i + 1} failed:`, error);
            if (i === retries - 1) {
                return { success: false, error: error.message };
            }
            // Wait for 2 seconds before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
};

module.exports = { sendEmail };
