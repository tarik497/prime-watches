// app/page.tsx — Root redirect to shop
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/shop');
}
