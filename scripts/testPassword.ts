import bcrypt from 'bcryptjs';

const testPassword = async () => {
  const password = 'Arqpn2492n';
  const storedHash = '$2a$10$jgpYSAX/9U5P40gusnPSJuJJtWgvtlbgrd74lE9J8Xti2X0J9MJxm';

  console.log('Testing password:', password);
  console.log('Against hash:', storedHash);

  const isValid = await bcrypt.compare(password, storedHash);
  console.log('Password valid:', isValid);

  const newHash = await bcrypt.hash(password, 10);
  console.log('New hash generated:', newHash);

  const testAgainstNew = await bcrypt.compare(password, newHash);
  console.log('Test against new hash:', testAgainstNew);
};

testPassword();
