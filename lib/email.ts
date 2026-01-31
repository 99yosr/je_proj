import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to your provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Sends a refusal email to the visitor (Junior) when their project request is rejected.
 * @param to - The email address of the Junior contact.
 * @param projectTitle - The title of the project that was refused.
 */
export async function sendRefusalEmail(to: string, projectTitle: string) {
    try {
        await transporter.sendMail({
            from: `"Responsable JE" <${process.env.EMAIL_USER}>`,
            to,
            subject: `Mise à jour de votre demande de projet : ${projectTitle}`,
            text: `Bonjour,

Nous avons le regret de vous informer que votre demande de projet "${projectTitle}" n'a pas été acceptée par le Responsable JE.

Cordialement,
L'équipe JET Project`,
            html: `<p>Bonjour,</p>
             <p>Nous avons le regret de vous informer que votre demande de projet "<strong>${projectTitle}</strong>" n'a pas été acceptée par le Responsable JE.</p>
             <p>Cordialement,<br>L'équipe JET Project</p>`,
        });
        console.log(`Email de refus envoyé à ${to} pour le projet "${projectTitle}"`);
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'email de refus:", error);
    }
}
