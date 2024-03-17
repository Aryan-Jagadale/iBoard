"use client"
import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { ConvexProviderWithClerk } from "convex/react-clerk";
import {
    AuthLoading,
    Authenticated,
    ConvexReactClient
} from "convex/react"
import { Loading } from '@/components/auth/loading';

interface ConvexProviderProps {
    children : React.ReactNode;
} 

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!; // "undefined" shouldn't be there
const published_key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const convex = new ConvexReactClient(convexUrl as string);

export const ConvexClientProvider = ({
    children
}:ConvexProviderProps) => {
    return (
        <ClerkProvider publishableKey={published_key}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <Authenticated>
          {children}
            </Authenticated>
            <AuthLoading>
                <Loading/>
            </AuthLoading>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    )

}