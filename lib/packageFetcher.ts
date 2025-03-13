export const fetchPackageCdn = async (packageName: string) => {
  try {
    const response = await fetch(`https://unpkg.com/${packageName}/package.json`);
    if (!response.ok) {
      return { exists: false, version: null };
    }
    const packageInfo = await response.json();
    if (packageInfo.version && packageInfo.main) {
      return { 
        exists: true, 
        version: packageInfo.version,
        packageName: packageInfo?.name || packageName, 
        main: packageInfo.main,
      };
    }
    return { exists: false, version: null };
    
  } catch (error) {
    console.error(`Error verifying package ${packageName}:`, error);
    return { exists: false, version: null };
  }
}

export const fetchPackages = async (search: string) => {
    const response: any = await fetchPackageCdn(search);
    if (!response.exists) {
        alert("Package not found");
        return [];
    }
    return [
        { name: response.packageName, version: response.version, main: response.main },
    ]
}


export function getGlobalVarName(packageName:any) {
  const packageMap:any = {
    'lodash': '_',
    'jquery': '$',
    'moment': 'moment',
    'axios': 'axios',
    // 'lucide-react': 'LucideReact'
  };
  
  return packageMap[packageName] || packageName;
}


export function updatePackageJson(packageJson: any, newDependencies: any) {
  let parsedContent = JSON.parse(packageJson.content);

  parsedContent.dependencies = {
    ...parsedContent.dependencies,
    ...newDependencies.dependencies
  };

  packageJson.content = JSON.stringify(parsedContent, null, 2);

  return packageJson;
}

export function removeDependencyFromPackageJson(packageJson: any, dependencyName: string) {
  let parsedContent = JSON.parse(packageJson.content);

  if (parsedContent.dependencies && parsedContent.dependencies[dependencyName]) {
    delete parsedContent.dependencies[dependencyName];
  }

  packageJson.content = JSON.stringify(parsedContent, null, 2);

  return packageJson;
}

function camelCase(str: string) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}