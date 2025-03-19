import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  return userId;
}

export async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
} 