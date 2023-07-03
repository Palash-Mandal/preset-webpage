// styles.js
export const cssCode = `
        :root{
            --matchhighlight:yellow;
            --nextprevheighlight:red;
        }
        .CodeMirror-matchhighlight {
            background-color:var(--matchhighlight,#ffd500)
        }
        .CodeMirror-line-match {
            background-color:var(--nextprevheighlight,red)  
        }
`;