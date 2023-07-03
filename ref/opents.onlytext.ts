import type { Editor } from 'grapesjs';
import { RequiredPluginOptions } from '..';
import { cmdImport } from './../consts';
import 'codemirror/addon/search/searchcursor.js';
import 'codemirror/addon/search/search.js';
import 'codemirror/mode/htmlmixed/htmlmixed';
import CodeMirror from 'codemirror';
import { cssCode } from './styles';
export default (editor: Editor, config: RequiredPluginOptions) => {
  // import css and bind the same
  const style = document.createElement('style');
  style.innerHTML = cssCode;
  document.head.appendChild(style);

  const pfx = editor.getConfig('stylePrefix');
  const importLabel = config.modalImportLabel;
  const importCnt = config.modalImportContent;

  editor.Commands.add(cmdImport, {
    codeViewer: null as any,
    container: null as HTMLElement | null,

    run(editor) {
      const codeContent = typeof importCnt == 'function' ? importCnt(editor) : importCnt;
      const codeViewer = this.getCodeViewer();
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
          const cursor = codeViewer.getSearchCursor(searchValue);
          codeViewer.operation(() => {
            while (cursor.findNext()) {
              // Highlight the search matches as needed
              // For example:
              codeViewer.markText(cursor.from(), cursor.to(), { className: 'CodeMirror-matchhighlight' });
            }
          });
        });
        container.appendChild(searchBar);

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
