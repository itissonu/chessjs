import SignIn from '@/components/signIn';
import React from 'react'
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Next_Auth } from '@/utils/auth';
const page = async() => {
    const session = await getServerSession(Next_Auth);
    // if (session?.user) {
    //   redirect('/');
    // }
   
  
    return <SignIn/>;
  
}

export default page