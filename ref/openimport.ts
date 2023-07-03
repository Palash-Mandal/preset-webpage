import type { Editor } from 'grapesjs';
import { RequiredPluginOptions } from '..';
import { cmdImport } from './../consts';
import 'codemirror/addon/search/searchcursor.js';
import 'codemirror/addon/search/search.js';
import 'codemirror/addon/dialog/dialog.js';
import 'codemirror/mode/htmlmixed/htmlmixed';
import { cssCode } from './styles';
import CodeMirror, { TextMarker, SearchCursor } from 'codemirror';

export default (editor: Editor, config: RequiredPluginOptions) => {
  // import css and bind the same
  const style = document.createElement('style');
  style.id = 'codMirrorSearch';
  style.innerHTML = cssCode;
  if (!document.getElementById('codMirrorSearch')) {
    document.head.appendChild(style);
  };


  const pfx = editor.getConfig('stylePrefix');
  const importLabel = config.modalImportLabel;
  const importCnt = config.modalImportContent;

  editor.Commands.add(cmdImport, {
    codeViewer: null as any,
    container: null as HTMLElement | null,
    cursor: null as SearchCursor | null,

    run(editor) {
      const codeContent = typeof importCnt == 'function' ? importCnt(editor) : importCnt;
      const codeViewer = this.getCodeViewer();
      const cursor = codeViewer.getSearchCursor('');
      this.cursor = cursor;

      editor.Modal.open({
        title: config.modalImportTitle,
        content: this.getContainer(),
      }).onceClose(() => editor.stopCommand(cmdImport));
      codeViewer.focus();
      codeViewer.setValue(codeContent ?? '');
    },

    stop() {
      editor.Modal.close();
    },

    getContainer() {
      if (!this.container) {
        const codeViewer = this.getCodeViewer();
        const container = document.createElement('div');
        container.className = `${pfx}import-container`;

        // Search bar
        const searchBar = document.createElement('input');
        searchBar.type = 'text';
        searchBar.placeholder = 'Search...';
        searchBar.addEventListener('input', () => {
          const searchValue = searchBar.value.trim();
          const cursor = this.cursor;
          codeViewer.operation(() => {
            codeViewer.getAllMarks().forEach((mark: TextMarker) => mark.clear());
            while (cursor && cursor.findNext()) {
              highlightMatch(codeViewer, cursor);
            }
          });
        });
        searchBar.addEventListener('keydown', event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            this.cursor?.findNext();
            highlightMatch(codeViewer, this.cursor);
          }
          if (event.key === 'Backspace') {
            this.cursor?.findPrevious();
            highlightMatch(codeViewer, this.cursor);
          }
        });
        container.appendChild(searchBar);

        // Previous button
        const prevButton = document.createElement('button');
        prevButton.type = 'button';
        prevButton.innerHTML = 'Previous';
        prevButton.onclick = () => {
          this.cursor?.findPrevious();
          highlightMatch(codeViewer, this.cursor);
        };
        container.appendChild(prevButton);

        // Next button
        const nextButton = document.createElement('button');
        nextButton.type = 'button';
        nextButton.innerHTML = 'Next';
        nextButton.onclick = () => {
          this.cursor?.findNext();
          highlightMatch(codeViewer, this.cursor);
        };
        container.appendChild(nextButton);

        // Clear button
        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.innerHTML = 'Clear';
        clearButton.onclick = () => {
          searchBar.value = '';
          codeViewer.operation(() => {
            codeViewer.getAllMarks().forEach((mark: TextMarker) => mark.clear());
          });
        };
        container.appendChild(clearButton);

        // Import Label
        if (importLabel) {
          const labelEl = document.createElement('div');
          labelEl.className = `${pfx}import-label`;
          labelEl.innerHTML = importLabel;
          container.appendChild(labelEl);
        }

        container.appendChild(codeViewer.getWrapperElement());

        // Import button
        const btnImp = document.createElement('button');
        btnImp.type = 'button';
        btnImp.innerHTML = config.modalImportButton;
        btnImp.className = `${pfx}btn-prim ${pfx}btn-import`;
        btnImp.onclick = () => {
          editor.Css.clear();
          editor.setComponents(codeViewer.getValue().trim());
          editor.Modal.close();
        };
        container.appendChild(btnImp);

        this.container = container;
      }

      return this.container;
    },

    /**
     * Return the code viewer instance
     * @returns {CodeMirror.Editor}
     */
    getCodeViewer() {
      if (!this.codeViewer) {
        const codeViewer = CodeMirror(document.createElement('div'), {
          mode: 'htmlmixed',
          readOnly: false,
          lineWrapping: true,
        });
        this.codeViewer = codeViewer;
      }

      return this.codeViewer;
    },
  });
};

// function highlightMatch(codeViewer: CodeMirror.Editor, cursor: SearchCursor | null) {
//   if (cursor) {
//     const from = cursor.from();
//     const to = cursor.to();
//     codeViewer.markText(from, to, { className: 'CodeMirror-matchhighlight' });
//   }
// }

function highlightMatch(codeViewer: CodeMirror.Editor, cursor: SearchCursor | null) {
  if (cursor && cursor.from() && cursor.to()) {
    const from = cursor.from();
    const to = cursor.to();
    codeViewer.markText(from, to, { className: 'CodeMirror-matchhighlight' });
  }
}
