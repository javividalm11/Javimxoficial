const WHATSAPP_NUMBER = '522871254233';

export const SITE = Object.freeze({
  email: 'javividalm11@gmail.com',
  instagram: '@javimxoficial',
  whatsappUrl(text = '') {
    const url = new URL(`https://wa.me/${WHATSAPP_NUMBER}`);
    if (text) url.searchParams.set('text', text);
    return url.toString();
  },
});
