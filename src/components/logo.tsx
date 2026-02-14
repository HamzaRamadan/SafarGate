import Image from 'next/image';

export function Logo() {
  return (
    <Image
      src="/logo.png"
      alt="Safar Gate"
      width={150}
      height={150}
      priority
    />
  );
}
