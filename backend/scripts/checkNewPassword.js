const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async function main(){
  try {
    const email = 'mateused0501@gmail.com';
    const plain = '@Mateus05060708';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return console.log('User not found');
    const ok = await bcrypt.compare(plain, user.passwordHash);
    console.log('Password match for provided plain:', ok);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
