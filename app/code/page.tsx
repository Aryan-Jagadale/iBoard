import React from 'react'
import Navbar from './[editorId]/_components/navbar/navbar'
import { ThemeProvider } from '@/components/layout/themeProvider'
import Dashboard from './_components/dashboard';
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs";


const MainPage = async () => {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }
  

  return (
    <div className='h-screen w-screen'>
      <ThemeProvider attribute="class"
        defaultTheme="dark"
        enableSystem={false}>
        <Navbar />
        <Dashboard userId={user?.id} />
      </ThemeProvider>

    </div>
  )
}

export default MainPage