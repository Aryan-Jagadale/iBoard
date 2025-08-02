// app/code/[editorId]/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-background p-4">
      {/* Navbar Skeleton */}
      <div className="h-16 bg-card rounded-lg mb-4 animate-pulse border">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-32 bg-muted rounded animate-pulse"></div>
            <div className="h-6 w-20 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
            <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main Editor Container - 16:9 aspect ratio */}
      <div className="aspect-[16/9] bg-card rounded-lg border overflow-hidden animate-pulse">
        <div className="h-full flex">
          {/* File Explorer Sidebar */}
          <div className="w-64 border-r bg-muted/30 p-4">
            <div className="space-y-3">
              <div className="h-6 w-24 bg-muted rounded animate-pulse"></div>
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                    <div className={`h-4 bg-muted rounded animate-pulse ${
                      i % 3 === 0 ? 'w-20' : i % 3 === 1 ? 'w-16' : 'w-24'
                    }`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col">
            {/* Tab Bar */}
            <div className="h-12 border-b bg-muted/20 flex items-center px-4 space-x-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                  <div className={`h-4 bg-muted rounded animate-pulse ${
                    i === 0 ? 'w-20' : i === 1 ? 'w-16' : 'w-18'
                  }`}></div>
                  {i === 0 && <div className="h-3 w-3 bg-muted rounded-full animate-pulse"></div>}
                </div>
              ))}
            </div>

            {/* Code Editor Content */}
            <div className="flex-1 p-4 space-y-3">
              {/* Line numbers and code lines */}
              {[...Array(12)].map((_, i) => (
                <div key={i} className="flex items-start space-x-4">
                  <div className="h-5 w-6 bg-muted rounded animate-pulse opacity-50"></div>
                  <div className="flex-1 space-y-1">
                    <div className={`h-5 bg-muted rounded animate-pulse ${
                      i % 4 === 0 ? 'w-3/4' : 
                      i % 4 === 1 ? 'w-1/2' : 
                      i % 4 === 2 ? 'w-5/6' : 'w-2/3'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel (Preview/Console) */}
          <div className="w-80 border-l bg-muted/20">
            {/* Panel Tabs */}
            <div className="h-12 border-b bg-muted/30 flex items-center px-4 space-x-4">
              <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-14 bg-muted rounded animate-pulse"></div>
            </div>
            
            {/* Panel Content */}
            <div className="p-4 space-y-4">
              <div className="h-32 bg-muted rounded animate-pulse"></div>
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`h-4 bg-muted rounded animate-pulse ${
                    i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-3/4' : 'w-1/2'
                  }`}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="h-8 bg-card rounded-lg mt-4 animate-pulse border flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="h-4 w-12 bg-muted rounded animate-pulse"></div>
          <div className="h-4 w-8 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}