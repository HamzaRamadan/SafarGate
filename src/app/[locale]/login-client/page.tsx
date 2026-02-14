import dynamic from 'next/dynamic';

const LoginStep2 = dynamic(() => import('./LoginStep2'), { ssr: false });

export default function LoginClientPage() {
  return <LoginStep2 />;
}
