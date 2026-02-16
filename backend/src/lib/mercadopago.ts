import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

// ⚠️ IMPORTANTE: Use seu token real aqui ou via process.env
const ACCESS_TOKEN = 'APP_USR-3039873080458856-021406-dda154d7d282df302aad727b4724b807-167654703';

// 1. Configuração Inicial (Exportamos como mpClient para a rota usar)
export const mpClient = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });

// 2. Instâncias úteis (Opcional, mas bom ter pronto)
export const payment = new Payment(mpClient);
export const preference = new Preference(mpClient);

// Log para garantir que o backend carregou isso
console.log("✅ Mercado Pago Configurado!");