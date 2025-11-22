import bcrypt from 'bcryptjs';

const generateHash = async () => {
  const password = 'Arqpn2492n';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
};

generateHash();
