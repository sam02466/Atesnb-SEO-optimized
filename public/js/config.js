/* =====================================================================
   SITE SETTINGS - the only file you need to edit to turn on
   email sending and Calendly booking. Full steps are in README.md.
   Leave a value empty ('') and that feature stays safely switched off.
   ===================================================================== */
window.SITE_CONFIG = {

  // Your Calendly booking link, e.g. 'https://calendly.com/your-name/30min'
  // Empty = the "Book a Call" buttons just scroll to the contact form.
  calendlyUrl: 'https://calendly.com/atesnb-info/30min',

  // EmailJS (free plan). Get these three values from your EmailJS dashboard.
  // The public key is meant to be visible in the page; it is NOT a password.
  emailjs: {
    publicKey: 'zbRN61_0tpcFwP4-R',    // Account > General > Public Key
    serviceId: 'service_bkpoktj',    // Email Services > your Gmail service > Service ID
    templateId: 'template_phh3l6b'    // Email Templates > your template > Template ID
  }
};
