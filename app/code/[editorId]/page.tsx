import { ThemeProvider } from "@/components/layout/themeProvider";
import dynamic from "next/dynamic";
import Navbar from "./_components/navbar/navbar";


const CodeEditor = dynamic(() => import('./_components/editor/index'), { ssr: false, loading: () => <div>Loading...</div> });

const Page = async () => {



  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      <div className="flex w-screen  flex-col h-screen bg-background">
        <div className="h-12 flex">
          <Navbar />
        </div>
        <div className="w-screen flex grow">
          <CodeEditor />
        </div>

      </div>
     </ThemeProvider>
  )
}

export default Page