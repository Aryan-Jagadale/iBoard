import pako from 'pako';

const editingScript = `
      <script>
        let editingEnabled = false;
        let selectedEl = null;

        // Receive messages from parent
        window.addEventListener('message', (e) => {
          if (e.data.type === 'TOGGLE_EDIT_MODE') {
            editingEnabled = e.data.enabled;
            if (!editingEnabled && selectedEl) {
              clearSelection();
            }
          } else if (e.data.type === 'APPLY_CHANGES') {
            if (selectedEl && e.data.changes) {
              // Apply content
              if (e.data.changes.content !== undefined) {
                selectedEl.innerHTML = e.data.changes.content;
              }
              // Apply styles
              Object.entries(e.data.changes.styles).forEach(([prop, val]) => {
                if (val && val !== 'normal' && val !== 'none') {
                  selectedEl.style[prop] = val;
                }
              });
              clearSelection();
              window.parent.postMessage({ type: 'STYLES_APPLIED' }, '*');
            }
          }
        });

        function highlightElement(el) {
          el.style.outline = '2px dashed #0070f3';
          el.style.outlineOffset = '2px';
          el.style.backgroundColor = 'rgba(0, 112, 243, 0.05)';
          el.style.transition = 'all 0.2s ease';
        }

        function clearSelection() {
          if (selectedEl) {
            selectedEl.style.outline = '';
            selectedEl.style.outlineOffset = '';
            selectedEl.style.backgroundColor = '';
          }
          selectedEl = null;
        }

        document.addEventListener('dblclick', (e) => {
          if (!editingEnabled) return;

          const el = e.target.closest('p, h1, h2, h3, h4, h5, h6, span, div, li');
          if (!el || !el.textContent?.trim()) return;

          clearSelection();
          selectedEl = el;
          highlightElement(selectedEl);

          const computed = getComputedStyle(selectedEl);
          const elData = {
            outerHTML: selectedEl.outerHTML,
            computedStyles: {
              content: selectedEl.innerHTML,
              fontWeight: computed.fontWeight,
              fontStyle: computed.fontStyle,
              textDecoration: computed.textDecorationLine || computed.textDecoration,
              color: computed.color,
              backgroundColor: computed.backgroundColor
            }
          };
          window.parent.postMessage({ type: 'ELEMENT_SELECTED', elData }, '*');
        }, true);

        document.addEventListener('mouseover', (e) => {
          if (!editingEnabled) return;
          const el = e.target.closest('p, h1, h2, h3, h4, h5, h6, span, div, li');
          if (el && el.textContent?.trim() && el !== selectedEl) {
            el.style.cursor = 'pointer';
            el.style.outline = '1px dotted #0070f3';
          }
        });

        document.addEventListener('mouseout', (e) => {
          if (!editingEnabled || selectedEl) return;
          const el = e.target.closest('p, h1, h2, h3, h4, h5, h6, span, div, li');
          if (el && el.textContent?.trim()) {
            el.style.cursor = '';
            el.style.outline = '';
          }
        });
      </script>
    `;

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
                    ${editingScript}
                </body>
                </html>`;
    return reactAppHTML;
}


export const tailwindReactAppHTML = (data:any) =>{

    let bundle: string;
    if (data?.isCompressed) {
        bundle = pako.ungzip(data?.bundle, { to: 'string' });
    }else{
        bundle = data.bundle;
    }
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
                `
              <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
              <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
             <script type="module">${bundle || ''}</script>
            </body>`
            );
    return html;
}