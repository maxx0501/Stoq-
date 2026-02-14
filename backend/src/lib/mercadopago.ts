import { MercadoPagoConfig, Payment } from 'mercadopago';

// ⚠️ IMPORTANTE: Use seu token real aqui ou via process.env
const ACCESS_TOKEN = 'APP_USR-3039873080458856-021406-dda154d7d282df302aad727b4724b807-167654703';

const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
export const paymentClient = new Payment(client);