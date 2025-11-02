import pako from 'pako';

const editingScript = `
<script>
  // ========== ROBUST TEXT EDITOR BRIDGE ==========
  const root = document.getElementById('root');
  if (!root) {
    console.error('No #root found');
    return;
  }

  let editableIdCounter = 0;
  const CLASS = 'editable-text';

  // Wrap all text nodes in a container
  const wrapText = (container) => {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(textNode => {
      if (!textNode.nodeValue?.trim()) return;
      if (textNode.parentNode?.closest('.' + CLASS)) return;

      const span = document.createElement('span');
      span.className = CLASS;
      span.dataset.id = 'editable_' + (editableIdCounter++);
      span.textContent = textNode.nodeValue;
      textNode.parentNode.replaceChild(span, textNode);
    });
  };

  // Initial wrap + observer
  const startEditing = () => {
    wrapText(root);

    const observer = new MutationObserver(mutations => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
            wrapText(node.parentNode);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            wrapText(node);
          }
        });
      });
    });

    observer.observe(root, { childList: true, subtree: true });
  };

  // ========== WAIT FOR REACT TO MOUNT ==========
  // React inserts first child into #root → start
  const checkForContent = () => {
    if (root.children.length > 0 || root.textContent?.trim()) {
      requestAnimationFrame(startEditing);
    } else {
      requestAnimationFrame(checkForContent);
    }
  };

  // Start checking
  if (root.children.length > 0) {
    startEditing();
  } else {
    checkForContent();
  }

  // ========== DOUBLE-CLICK ==========
  document.addEventListener('dblclick', e => {
    const span = e.target.closest('.' + CLASS);
    if (!span) return;

    window.parent.postMessage({
      type: 'OPEN_EDITOR',
      id: span.dataset.id,
      html: span.innerHTML
    }, '*');
  });

  // ========== UPDATE FROM PARENT ==========
  window.addEventListener('message', ev => {
    if (ev.source !== window.parent) return;
    const { type, id, html } = ev.data || {};
    if (type !== 'UPDATE_TEXT') return;

    const span = document.querySelector('[data-id="' + id + '"]');
    if (span) span.innerHTML = html;
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
                    ${editingScript}
                    <script type="module">${bundle}</script>
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