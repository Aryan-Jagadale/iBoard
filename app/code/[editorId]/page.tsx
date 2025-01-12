import { ThemeProvider } from "@/components/layout/themeProvider";
import dynamic from "next/dynamic";
import Navbar from "./_components/navbar/navbar";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs";


interface CodePageProps {
  params: { editorId: string };
}

const CodeEditor = dynamic(() => import('./_components/editor/index'), { ssr: false, loading: () => <div>Loading...</div> });

const Page = async ({ params }: CodePageProps) => {
  const user = await currentUser();
  if (!user) {
    redirect("/");
  }
  const { editorId } = params;

  //TODO: Add a check to ensure the editorId is a valid ULID
  const ulidRegex = /^[0-9A-Z]{26}$/;
  if (!ulidRegex.test(editorId)) {
    redirect("/");
  }



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