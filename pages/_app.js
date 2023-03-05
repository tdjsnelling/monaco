import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  :root {
    --space-0: 0px;
    --space-1: 2px;
    --space-2: 4px;
    --space-3: 8px;
    --space-4: 16px;
    
    --colour-bg: #111;
    --colour-fg: #fff;
    --colour-border: #555;
    --colour-offset: #222;
    
    --fontSize-body: 13px;
    --fontFamily-body: monospace;
  }
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    background-color: var(--colour-bg);
    color: var(--colour-fg);
    font-family: var(--fontFamily-body);
    font-size: var(--fontSize-body);
  }
  button {
    appearance: none;
    background-color: var(--colour-bg);
    color: var(--colour-fg);
    border: 1px solid var(--colour-fg);
    padding: var(--space-2) var(--space-3);
    font-size: var(--fontSize-body);
    font-family: var(--fontFamily-body);
    cursor: pointer;
  }
`;

export default function App({ Component, pageProps }) {
  return (
    <>
      <GlobalStyle />
      <Component {...pageProps} />
    </>
  );
}
