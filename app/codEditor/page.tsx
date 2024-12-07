import React from 'react'
import Navbar from './[editorId]/_components/navbar/navbar'
import { ThemeProvider } from '@/components/layout/themeProvider'
import Dashboard from './_components/dashboard'

const MainPage = () => {
  return (
    <>
      <ThemeProvider attribute="class"
        defaultTheme="dark"
        enableSystem={false}>
        <Navbar />
        <Dashboard />
      </ThemeProvider>

    </>
  )
}

export default MainPage