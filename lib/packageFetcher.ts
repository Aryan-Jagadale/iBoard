import { cache } from 'react'

export const fetchPackageCdn = cache(async (packageName: string) => {
  try {
    // Fetch the actual CDN content
    const response = await fetch(`https://esm.sh/${packageName}`, {
      headers: {
        'Accept': 'text/plain' 
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch CDN content: ${response.statusText}`)
    }

    // Get the CDN content as text
    const cdnContent = await response.text()
    return extractPackageInfo(cdnContent)
  } catch (error) {
    console.error('Error fetching CDN content:', error)
    throw error
  }
})


function extractPackageInfo(cdnContent: string) {
    // Look for the pattern /* esm.sh - package-name@version */
    const firstLineMatch = cdnContent.match(/\/\* esm\.sh - ([^@]+)@([\d.]+) \*\//);
    if (!firstLineMatch) {
      return null;
    }
    return {
      packageName: firstLineMatch[1],
      version: firstLineMatch[2]
    };
  }