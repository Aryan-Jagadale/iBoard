import pako from 'pako';

export const reactAppHTML = (data:any) =>{
    let bundle: string;
    if (data?.isCompressed) {
        bundle = pako.ungzip(data?.bundle, { to: 'string' });
    }else{
        bundle = data.bundle;
    }
    const reactAppHTML = `
            <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>React App Preview</title>
                    <style>${data?.cssFiles}</style> 
                </head>
                <body>
                    <div id="root"></div>
                    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
                    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
                    <script type="module">${bundle}</script>
                </body>
                </html>`;
    return reactAppHTML;
}


export const tailwindReactAppHTML = (data:any) =>{
    let html = data.indexHtml;
    html = html.replace(
                /<div id="root">.*<\/div>/,
                '<div id="root"></div>'
            );
    html = html.replace(
                '</head>',
                `<style>${data?.cssFiles || ''}</style></head>`
            );
    html = html.replace(
                '</body>',
                `<script src="https://unpkg.com/react@18/umd/react.production.min.js"
                  integrity="sha384-6jL1rR/+qvOB0fOkH1ZZ1xd6QbaO5jM90+hCbGyF/F7fs/3Gzdh0dX8GkODdgqTi"
                  crossorigin="anonymous"></script>
             <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"
                  integrity="sha384-+2c+hJ1ytY1/6V2vNh+lX6YsJhBKt3vnDnN/SUXOc6Bx/OVCkXbkqVKgf/mBlC9F"
                  crossorigin="anonymous"></script>
             <script type="module">${data?.bundle || ''}</script>
            </body>`
            );
    return html;
}